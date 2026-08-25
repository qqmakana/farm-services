"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { DriverVerifiedBadge } from "@/components/driver-verified-badge";
import { DriverVehiclePhotos } from "@/components/driver-vehicle-photos";
import { RiderSafetyTips } from "@/components/trip/rider-safety-tips";
import { TripQuickReplies } from "@/components/trip/trip-quick-replies";
import { UberShell } from "@/components/uber/uber-shell";
import { isDriverTrustVerified } from "@/lib/trust";
import {
  cancelRiderJobAction,
  getJobByReference,
  getRatingForJob,
  rateTrip,
  saveCustomerFcmToken,
  setTripTip,
  triggerSos,
} from "@/lib/actions";
import { MessageCircle, Phone, Share2, Star } from "lucide-react";
import { ContactSupportActions } from "@/components/support/contact-support";
import {
  BRAND,
  BRAND_WHATSAPP_HREF,
  emergencyMailtoHref,
  emergencySmsHref,
  whatsappTripShareHref,
} from "@/lib/brand";
import {
  isFirebaseClientConfigured,
  requestFcmToken,
} from "@/lib/firebase/client";
import { useJobRealtime } from "@/lib/use-job-realtime";
import {
  formatMoney,
  SERVICE_LABELS,
  STATUS_LABELS,
  VEHICLE_LABELS,
} from "@/lib/format";
import { distanceKm, etaMinutes } from "@/lib/geo";
import {
  driverHasArrived,
  isActiveTripStatus,
  isConfirmedStatus,
  isSearchingStatus,
} from "@/lib/job-status";
import {
  leaveByLabel,
  RIDER_QUICK_REPLIES,
  tripWhatsAppHref,
} from "@/lib/trip-quick-replies";
import { splitRiderFare } from "@/lib/pricing";
import type { JobWithDriver, Rating } from "@/lib/types";
import { tipAmountFromDetails, tipPresetAmounts } from "@/lib/tips";

function elapsedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const mins = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (mins < 1) return "Just started";
  return `${mins} min elapsed`;
}

export function LiveTrip({
  initialJob,
  initialRating,
}: {
  initialJob: JobWithDriver;
  initialRating: Rating | null;
}) {
  const [job, setJob] = useState(initialJob);
  const [rating, setRating] = useState(initialRating);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [tipChoice, setTipChoice] = useState<number | null>(
    tipAmountFromDetails(initialJob.details),
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void (async () => {
      const fresh = await getJobByReference(job.reference_code);
      if (fresh) setJob(fresh);
      const r = await getRatingForJob(job.id);
      setRating(r);
    })();
  }, [job.reference_code, job.id]);

  useJobRealtime(job.id, refresh);

  useEffect(() => {
    const t = setInterval(() => {
      void fetch("/api/dispatch/tick?source=client", { method: "POST" }).catch(
        () => null,
      );
      refresh();
    }, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!isSearchingStatus(job.status)) return;
    if (!isFirebaseClientConfigured()) return;
    void (async () => {
      try {
        const token = await requestFcmToken();
        if (token) await saveCustomerFcmToken(job.id, token);
      } catch {
        /* optional */
      }
    })();
  }, [job.id, job.status]);

  const isActiveTrip = isActiveTripStatus(job.status);
  const searching = isSearchingStatus(job.status) && !job.dispatch_exhausted;
  const noDrivers =
    Boolean(job.dispatch_exhausted) && isSearchingStatus(job.status);
  const confirmed = isConfirmedStatus(job.status);
  const inProgress = job.status === "in_progress";
  const completed = job.status === "completed";
  const cancelled = job.status === "cancelled";
  const arrived = confirmed && driverHasArrived(job);

  const pickup =
    job.pickup_lat != null && job.pickup_lng != null
      ? { lat: job.pickup_lat, lng: job.pickup_lng }
      : null;
  const dropoff =
    job.dropoff_lat != null && job.dropoff_lng != null
      ? { lat: job.dropoff_lat, lng: job.dropoff_lng }
      : null;
  const driverPin =
    job.driver_lat != null && job.driver_lng != null
      ? { lat: job.driver_lat, lng: job.driver_lng }
      : null;

  const eta =
    job.driver_lat != null &&
    job.driver_lng != null &&
    job.pickup_lat != null &&
    job.pickup_lng != null &&
    confirmed &&
    !arrived
      ? etaMinutes(
          distanceKm(
            { lat: job.driver_lat, lng: job.driver_lng },
            { lat: job.pickup_lat, lng: job.pickup_lng },
          ),
        )
      : null;
  const leaveBy = leaveByLabel(eta);
  const driverChatHref = tripWhatsAppHref(
    job.drivers?.phone,
    `Hi ${job.drivers?.full_name?.split(" ")[0] || "there"} — I'm your Village Ride rider for ${job.reference_code}. Pickup: ${job.pickup_landmark}`,
    job.country_code,
  );

  const fare = Number(job.fee_amount) || 0;
  const split = splitRiderFare(fare);
  const platformFee = Number(job.platform_commission) || split.platform;
  const driverKeeps = Number(job.driver_payout) || split.driver;
  const savedTip = tipAmountFromDetails(job.details);

  function submitTip() {
    setMsg(null);
    const amount = tipChoice ?? 0;
    startTransition(async () => {
      try {
        const next = await setTripTip(job.id, amount);
        setJob(next);
        setTipChoice(tipAmountFromDetails(next.details));
        setMsg(
          amount > 0
            ? `Tip saved — pay the driver ${formatMoney(amount)} in cash. 100% theirs.`
            : "No tip. You can still rate the driver.",
        );
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not save tip");
      }
    });
  }

  function submitRating() {
    setMsg(null);
    startTransition(async () => {
      try {
        const r = await rateTrip(job.id, stars, comment || undefined);
        setRating(r);
        setMsg("Thanks — your rating keeps Village Ride safer for everyone.");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not rate");
      }
    });
  }

  function cancelTrip() {
    if (!job.customer_phone) {
      setMsg("Add your phone on this trip to cancel.");
      return;
    }
    if (
      !window.confirm("Cancel this trip? You can book again from Home.")
    ) {
      return;
    }
    setMsg(null);
    startTransition(async () => {
      try {
        await cancelRiderJobAction({
          jobId: job.id,
          customerPhone: job.customer_phone,
        });
        window.location.assign("/");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not cancel");
      }
    });
  }

  function runSos() {
    setMsg(null);
    startTransition(async () => {
      try {
        let lat = job.driver_lat ?? job.pickup_lat ?? undefined;
        let lng = job.driver_lng ?? job.pickup_lng ?? undefined;
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>(
              (resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 5000,
                }),
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch {
            /* optional */
          }
        }
        await triggerSos(job.id, "Customer SOS", lat, lng);

        const mapsUrl =
          lat != null && lng != null
            ? `https://maps.google.com/?q=${lat},${lng}`
            : `${window.location.origin}/trip/${job.reference_code}`;

        window.location.href = emergencySmsHref(mapsUrl);
        window.setTimeout(() => {
          if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
            window.open(emergencyMailtoHref(mapsUrl), "_blank");
          }
        }, 400);

        setMsg(
          `SOS sent to ops. Alerting ${BRAND.phone} — stay safe. Call 10111 if in immediate danger.`,
        );
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "SOS failed");
      }
    });
  }

  const bookAgainHref =
    job.service_type === "delivery"
      ? "/delivery"
      : job.service_type === "farm"
        ? "/farm"
        : job.service_type === "courier"
          ? "/courier"
          : "/ride";

  const paymentLabel =
    job.payment_method === "cash" || !job.payment_method
      ? job.payment_status === "cash_collected"
        ? "Cash · paid to driver"
        : job.cash_collected_confirmed === false
          ? "Cash · ops review"
          : "Cash — pay driver"
      : job.payment_status === "paid_online"
        ? job.payment_method === "card"
          ? "Paid · Card (PayPal)"
          : "Paid · PayPal"
        : "Payment pending";

  const showCashReminder =
    (job.payment_method === "cash" || !job.payment_method) &&
    job.payment_status === "unpaid" &&
    job.cash_collected_confirmed !== false &&
    (confirmed || inProgress || completed);

  const shareHref = whatsappTripShareHref(
    job.pickup_landmark,
    job.dropoff_landmark,
  );

  const headline = completed
    ? "Thanks for riding"
    : arrived
    ? "Your driver has arrived"
    : eta != null && confirmed
      ? `Pick-up in ${eta} min`
      : noDrivers
        ? "No drivers available"
        : STATUS_LABELS[job.status];

  const subhead = arrived && job.drivers
    ? `Look for ${job.drivers.full_name.split(" ")[0]} at ${job.pickup_landmark}`
    : leaveBy && confirmed && job.drivers
      ? `Leave by ${leaveBy} to meet ${job.drivers.full_name.split(" ")[0]}`
      : `${SERVICE_LABELS[job.service_type]} · ${job.reference_code}`;

  return (
    <UberShell
      pin={pickup}
      dropoffPin={dropoff}
      driverPin={driverPin}
      hideLocationHint
      autoSnapOnRoute={false}
      cinematic={inProgress}
      searchingRadar={searching}
      initialSnap="mid"
      snap={completed || cancelled || noDrivers ? "full" : undefined}
      enterFromPeek={searching}
      onBack={() => window.location.assign("/")}
      topRightLabel={job.reference_code}
      title="Your trip"
    >
      <div className="animate-[uberFadeIn_200ms_ease-out] space-y-3 text-black">
        <p className="text-[11px] font-medium text-[#6B6B6B]">
          {driverPin
            ? "Live driver location (updates every few seconds)"
            : "Pickup to drop-off — driver appears when assigned"}
        </p>

        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#6B6B6B]">
            {noDrivers
              ? "Unavailable"
              : searching
                ? "Searching"
                : arrived
                  ? "Driver is here"
                  : confirmed
                    ? "On the way"
                    : inProgress
                      ? "Trip in progress"
                      : completed
                        ? "Completed"
                        : "Live trip"}
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.04em] text-black">
            {headline}
          </h1>
          <p className="mt-1 text-[15px] text-[#6B6B6B]">{subhead}</p>
        </div>

        {searching ? (
          <div className="flex flex-col items-center gap-3 rounded-[16px] bg-[#F3F3F3] px-4 py-8 text-center">
            <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent" />
            <p className="text-[16px] font-medium text-black">
              Finding your driver...
            </p>
            <p className="max-w-sm text-[15px] text-[#6B6B6B]">
              Offering to the best-matched online driver
              {job.dispatch_attempts
                ? ` (attempt ${job.dispatch_attempts}/3)`
                : ""}
              . If they don&apos;t accept in 30 seconds, we try the next one.
            </p>
            <button
              type="button"
              data-testid="cancel-trip"
              disabled={pending}
              onClick={cancelTrip}
              className="uber-press mt-1 min-h-11 text-[15px] font-semibold text-[#CB4040]"
            >
              Cancel trip
            </button>
            <a
              href={`${BRAND_WHATSAPP_HREF}?text=${encodeURIComponent(
                `Hi Village Ride — need help with trip ${job.reference_code}`,
              )}`}
              className="uber-press flex min-h-11 items-center justify-center rounded-full bg-[#25D366] px-4 text-[15px] font-semibold text-white"
            >
              WhatsApp dispatch
            </a>
          </div>
        ) : null}

        {noDrivers ? (
          <div className="rounded-[16px] bg-[#fdecea] px-4 py-6 text-center">
            <p className="text-[20px] font-bold text-black">
              No drivers available right now
            </p>
            <p className="mt-2 text-[15px] text-[#6B6B6B]">
              {Number(job.dispatch_attempts) > 0
                ? `${Number(job.dispatch_attempts)} driver${
                    Number(job.dispatch_attempts) === 1 ? "" : "s"
                  } ${
                    Number(job.dispatch_attempts) === 1 ? "was" : "were"
                  } offered and none accepted.`
                : "No drivers are online near you right now."}{" "}
              Book again, schedule for later, or WhatsApp dispatch on{" "}
              {BRAND.phone}.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={bookAgainHref}
                className="uber-press flex min-h-12 items-center justify-center rounded-full bg-black text-[17px] font-medium text-white"
              >
                Book again
              </a>
              <a
                href={`${BRAND_WHATSAPP_HREF}?text=${encodeURIComponent(
                  `Hi — no driver for ${job.reference_code}. Can you help?`,
                )}`}
                className="uber-press flex min-h-12 items-center justify-center rounded-full bg-[#25D366] text-[15px] font-semibold text-white"
              >
                WhatsApp dispatch
              </a>
            </div>
          </div>
        ) : null}

        {(confirmed || inProgress) && job.drivers ? (
          <div className="space-y-3">
            {inProgress ? (
              <div>
                <p className="text-[13px] text-[#6B6B6B]">Current fare</p>
                <p className="text-[28px] font-bold tracking-[-0.04em]">
                  {formatMoney(fare)}
                </p>
                <p className="text-[13px] text-[#6B6B6B]">
                  {elapsedLabel(job.started_at ?? job.assigned_at)}
                </p>
              </div>
            ) : null}

            <DriverVehiclePhotos driver={job.drivers} />

            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-black">
                  {job.drivers.full_name}
                  <span className="ml-1.5 font-medium text-[#6B6B6B]">
                    ★{job.drivers.rating_avg.toFixed(1)}
                  </span>
                </p>
                <p className="text-[13px] text-[#6B6B6B]">
                  {[
                    job.drivers.vehicle_color,
                    job.drivers.vehicle_make,
                    job.drivers.vehicle_model,
                    job.drivers.vehicle_registration,
                    VEHICLE_LABELS[job.drivers.vehicle_type],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {eta != null ? ` · ${eta} min away` : ""}
                </p>
                <DriverVerifiedBadge
                  verified={isDriverTrustVerified(job.drivers)}
                  compact
                  hideUnverified
                />
              </div>
              <div className="flex shrink-0 gap-2">
                {driverChatHref ? (
                  <a
                    href={driverChatHref}
                    className="uber-press flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F3F3] text-black"
                    aria-label="Send a message"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                  </a>
                ) : null}
                {job.drivers.phone ? (
                  <a
                    href={`tel:${job.drivers.phone}`}
                    className="uber-press flex h-11 w-11 items-center justify-center rounded-full bg-black text-white"
                    aria-label="Call driver"
                  >
                    <Phone className="h-5 w-5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>

            {job.drivers.phone && confirmed ? (
              <TripQuickReplies
                phone={job.drivers.phone}
                countryCode={job.country_code}
                replies={RIDER_QUICK_REPLIES}
              />
            ) : null}

            <div className="flex gap-2">
              {isActiveTrip ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={runSos}
                  className="uber-press flex min-h-12 flex-1 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-[#CB4040] ring-1 ring-[#EEEEEE]"
                  aria-label="Safety SOS"
                >
                  SOS
                </button>
              ) : null}
              <a
                href={shareHref}
                className="uber-press flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#F3F3F3] text-[15px] font-semibold text-black"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Share trip
              </a>
            </div>

            {confirmed ? (
              <button
                type="button"
                data-testid="cancel-trip"
                disabled={pending}
                onClick={cancelTrip}
                className="uber-press w-full min-h-11 text-[15px] font-semibold text-[#CB4040]"
              >
                Cancel trip
              </button>
            ) : null}
          </div>
        ) : null}

        {showCashReminder ? (
          <p className="rounded-[12px] bg-[#F3F3F3] px-3 py-2 text-[13px] font-medium text-black">
            Pay the driver {formatMoney(fare)} in cash
            {completed ? " now if you haven't already." : " when you meet them."}
          </p>
        ) : null}

        {completed ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] text-[#6B6B6B]">Trip fare</span>
                <span className="text-[28px] font-bold tracking-[-0.04em]">
                  {formatMoney(fare)}
                </span>
              </div>
              <div className="flex justify-between text-[13px] text-[#6B6B6B]">
                <span>Platform fee</span>
                <span>{formatMoney(platformFee)}</span>
              </div>
              <div className="flex justify-between text-[13px] font-medium text-[#05944F]">
                <span>Driver keeps</span>
                <span>{formatMoney(driverKeeps)}</span>
              </div>
              <div className="flex justify-between border-t border-[#EEEEEE] pt-2 text-[17px] font-bold">
                <span>Total</span>
                <span>{formatMoney(fare + (savedTip ?? 0))}</span>
              </div>
              <p className="text-[13px] text-[#6B6B6B]">{paymentLabel}</p>
            </div>

            {savedTip == null ? (
              <div data-testid="tip-selector" className="space-y-3">
                <h2 className="text-[20px] font-bold">Add a tip</h2>
                <p className="text-[13px] text-[#6B6B6B]">
                  100% goes to the driver. Pay them in cash — not taken from the
                  Village Ride fare.
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Tip amount"
                >
                  {tipPresetAmounts(job.country_code).map((n) => (
                    <button
                      key={n}
                      type="button"
                      data-testid={`tip-${n}`}
                      aria-pressed={tipChoice === n}
                      onClick={() => setTipChoice(n)}
                      className={`uber-press min-h-11 rounded-full px-4 text-[15px] font-bold ${
                        tipChoice === n
                          ? "bg-black text-white"
                          : "bg-[#F3F3F3] text-black"
                      }`}
                    >
                      {n === 0 ? "No tip" : formatMoney(n)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  data-testid="tip-pay"
                  disabled={pending || tipChoice == null}
                  onClick={submitTip}
                  className="uber-press w-full rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
                >
                  {tipChoice && tipChoice > 0
                    ? `Pay ${formatMoney(fare + tipChoice)}`
                    : "Pay " + formatMoney(fare)}
                </button>
              </div>
            ) : null}

            {!rating ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[20px] font-bold">Rate your driver</h2>
                  <a
                    href="/"
                    className="text-[15px] font-semibold text-[#6B6B6B]"
                  >
                    Skip
                  </a>
                </div>
                <div className="flex justify-center gap-2" role="group" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n}`}
                      aria-pressed={stars === n}
                      onClick={() => setStars(n)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        stars >= n
                          ? "bg-black text-white"
                          : "bg-[#F3F3F3] text-[#A6A6A6]"
                      }`}
                    >
                      <Star
                        className="h-6 w-6"
                        fill={stars >= n ? "currentColor" : "none"}
                        aria-hidden
                      />
                      <span className="sr-only">{n}</span>
                    </button>
                  ))}
                </div>
                <input
                  className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
                  placeholder="Optional comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={submitRating}
                  className="uber-press w-full rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
                >
                  Submit rating
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-[15px]">
                <p>
                  You rated ★{rating.stars}
                  {rating.comment ? ` — “${rating.comment}”` : ""}
                </p>
                <a
                  href={bookAgainHref}
                  className="uber-press flex min-h-12 items-center justify-center rounded-full bg-black text-[17px] font-medium text-white"
                >
                  Request another
                </a>
                <a
                  href="/"
                  className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-black"
                >
                  Back to home
                </a>
              </div>
            )}
          </div>
        ) : null}

        {cancelled ? (
          <div className="space-y-3 text-center">
            <p className="text-[17px] font-bold">This trip was cancelled</p>
            <a
              href={bookAgainHref}
              className="uber-press flex min-h-12 items-center justify-center rounded-full bg-black text-[17px] font-medium text-white"
            >
              Book again
            </a>
          </div>
        ) : null}

        {!searching && !completed ? (
          <div className="space-y-1 text-[13px] text-[#6B6B6B]">
            <p>
              <span className="font-semibold text-black">Pickup </span>
              {job.pickup_landmark}
            </p>
            <p>
              <span className="font-semibold text-black">Dropoff </span>
              {job.dropoff_landmark}
            </p>
            <p>
              Fare {formatMoney(fare)} · {paymentLabel}
            </p>
          </div>
        ) : null}

        {searching || confirmed ? (
          <a
            href={shareHref}
            className="uber-press flex min-h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-[15px] font-semibold text-white"
          >
            Share trip details via WhatsApp
          </a>
        ) : null}

        {!searching ? (
          <>
            <section className="rounded-[16px] bg-[#F3F3F3] p-4">
              <p className="text-[13px] font-semibold text-[#6B6B6B]">Need help?</p>
              <ContactSupportActions
                compact
                className="mt-2"
                whatsappPrefill={`Hi ${BRAND.appName} support — I need help with trip ${job.reference_code}`}
              />
            </section>
            <RiderSafetyTips />
          </>
        ) : null}

        {msg ? <p className="text-[13px] text-[#6B6B6B]">{msg}</p> : null}
      </div>
    </UberShell>
  );
}
