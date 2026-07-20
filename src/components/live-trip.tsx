"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, useCallback } from "react";
import { DriverVerifiedBadge } from "@/components/driver-verified-badge";
import { isDriverTrustVerified } from "@/lib/trust";
import {
  getJobByReference,
  getRatingForJob,
  rateTrip,
  saveCustomerFcmToken,
  triggerSos,
} from "@/lib/actions";
import {
  BRAND,
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
import { distanceKm, etaMinutes, osmEmbedUrl } from "@/lib/geo";
import {
  isActiveTripStatus,
  isConfirmedStatus,
  isSearchingStatus,
} from "@/lib/job-status";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import type { JobStatus, JobWithDriver, Rating } from "@/lib/types";

const STEPS: JobStatus[] = [
  "searching_driver",
  "confirmed",
  "in_progress",
  "completed",
];

function stepIndex(status: JobStatus): number {
  if (isSearchingStatus(status)) return 0;
  if (isConfirmedStatus(status)) return 1;
  if (status === "in_progress") return 2;
  if (status === "completed") return 3;
  return -1;
}

export function LiveTrip({
  initialJob,
  initialRating,
}: {
  initialJob: JobWithDriver;
  initialRating: Rating | null;
}) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [rating, setRating] = useState(initialRating);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
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
      void fetch("/api/dispatch/tick", { method: "POST" }).catch(() => null);
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

  const active = stepIndex(job.status);
  const mapLat = job.driver_lat ?? job.pickup_lat;
  const mapLng = job.driver_lng ?? job.pickup_lng;
  const isActiveTrip = isActiveTripStatus(job.status);
  const searching = isSearchingStatus(job.status) && !job.dispatch_exhausted;
  const noDrivers =
    Boolean(job.dispatch_exhausted) && isSearchingStatus(job.status);
  const confirmed = isConfirmedStatus(job.status);

  const eta =
    job.driver_lat != null &&
    job.driver_lng != null &&
    job.pickup_lat != null &&
    job.pickup_lng != null &&
    confirmed
      ? etaMinutes(
          distanceKm(
            { lat: job.driver_lat, lng: job.driver_lng },
            { lat: job.pickup_lat, lng: job.pickup_lng },
          ),
        )
      : null;

  function submitRating() {
    setMsg(null);
    startTransition(async () => {
      try {
        const r = await rateTrip(job.id, stars, comment || undefined);
        setRating(r);
        setMsg("Thanks for your rating.");
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not rate");
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

        // Prefer SMS; mailto as secondary (some desktop browsers).
        window.location.href = emergencySmsHref(mapsUrl);
        window.setTimeout(() => {
          // If SMS app didn't take over (desktop), open email too.
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

  const paymentLabel =
    job.payment_method === "cash"
      ? job.payment_status === "cash_collected"
        ? "Cash collected"
        : "Cash — pay driver"
      : job.payment_status === "paid_online"
        ? job.payment_method === "card"
          ? "Paid · Card"
          : "Paid · PayPal"
        : "Payment pending";

  return (
    <div className="relative space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
            {noDrivers
              ? "Unavailable"
              : searching
                ? "Searching"
                : confirmed
                  ? "Confirmed"
                  : "Live trip"}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            {noDrivers
              ? "No drivers available"
              : STATUS_LABELS[job.status]}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {SERVICE_LABELS[job.service_type]} · {job.reference_code}
            {eta != null ? ` · ETA ${eta} min` : ""}
          </p>
        </div>
        {isActiveTrip ? (
          <button
            type="button"
            disabled={pending}
            onClick={runSos}
            className="shrink-0 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-rose-500 disabled:opacity-60"
          >
            SOS / Emergency
          </button>
        ) : null}
      </div>

      {searching ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#1A4D3A]/20 bg-[#E8F5E9] px-4 py-8 text-center">
          <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#1A4D3A] border-t-transparent" />
          <p className="text-base font-bold text-[#1A4D3A]">
            Finding your driver...
          </p>
          <p className="max-w-sm text-sm text-slate-600">
            Offering to the best-matched online driver
            {job.dispatch_attempts
              ? ` (attempt ${job.dispatch_attempts}/3)`
              : ""}
            . If they don&apos;t accept in 30 seconds, we try the next one.
          </p>
        </div>
      ) : null}

      {noDrivers ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-center">
          <p className="text-base font-bold text-amber-950">
            No drivers available. Try again later.
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            Three drivers were offered and none accepted. You can book again
            from the home screen, or WhatsApp dispatch on {BRAND.phone}.
          </p>
          <a
            href="/"
            className="mt-4 inline-flex rounded-xl bg-[#1A4D3A] px-4 py-2.5 text-sm font-bold text-white"
          >
            Back to home
          </a>
        </div>
      ) : null}

      {confirmed && job.drivers ? (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
          <p className="font-bold">
            ✅ Driver Confirmed! {job.drivers.full_name} (
            {VEHICLE_LABELS[job.drivers.vehicle_type]})
            {eta != null ? ` — about ${eta} mins` : " — on the way"}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${job.drivers.phone}`}
              className="rounded-lg bg-[#1A4D3A] px-3 py-2 text-xs font-bold text-white"
            >
              Call driver
            </a>
            <a
              href={`https://wa.me/${toWhatsAppNumber(job.drivers.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
            >
              WhatsApp driver
            </a>
            <DriverVerifiedBadge verified={job.drivers.id_verified} compact />
          </div>
        </div>
      ) : null}

      {searching || confirmed ? (
        <a
          href={whatsappTripShareHref(
            job.pickup_landmark,
            job.dropoff_landmark,
          )}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#1ebe57]"
        >
          <span aria-hidden>WhatsApp</span>
          Share trip details via WhatsApp
        </a>
      ) : null}

      {mapLat != null && mapLng != null && (
        <div className="ru-card overflow-hidden">
          <iframe
            title="Live map"
            className="h-64 w-full border-0"
            src={osmEmbedUrl(mapLat, mapLng)}
          />
          <p className="px-3 py-2 text-xs text-slate-500">
            {job.driver_lat != null
              ? "Live driver location (updates every few seconds)"
              : "Pickup area — driver GPS appears when assigned"}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isActiveTrip ? (
          <button
            type="button"
            className="ru-btn bg-rose-600 text-white hover:bg-rose-500"
            disabled={pending}
            onClick={runSos}
          >
            SOS / Emergency
          </button>
        ) : null}
        <a
          href={whatsappTripShareHref(
            job.pickup_landmark,
            job.dropoff_landmark,
          )}
          target="_blank"
          rel="noreferrer"
          className="ru-btn bg-[#25D366] text-white hover:bg-[#1ebe57]"
        >
          WhatsApp trip
        </a>
        <button
          type="button"
          className="ru-btn border border-slate-200 bg-white text-slate-800"
          onClick={() => {
            const url = `${window.location.origin}/trip/${job.reference_code}`;
            void navigator.clipboard?.writeText(url);
            setMsg("Trip link copied — share with family.");
          }}
        >
          Copy trip link
        </button>
      </div>

      <div className="ru-card p-5">
        <ol className="space-y-4">
          {STEPS.map((step, i) => {
            const done = active > i || job.status === "completed";
            const current = active === i;
            return (
              <li key={step} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done || current
                      ? "bg-[var(--ru-brand)] text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done && !current ? "✓" : i + 1}
                </span>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      current ? "text-[var(--ru-brand)]" : "text-slate-800"
                    }`}
                  >
                    {STATUS_LABELS[step]}
                  </p>
                  {current && job.drivers && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-slate-500">
                        {job.drivers.full_name} · ★
                        {job.drivers.rating_avg.toFixed(1)} ·{" "}
                        {VEHICLE_LABELS[job.drivers.vehicle_type]}
                      </p>
                      <DriverVerifiedBadge
                        verified={job.drivers.id_verified}
                        compact
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="ru-card space-y-3 p-5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Fare</span>
          <span className="font-semibold">
            {formatMoney(Number(job.fee_amount))}
            <span className="ml-2 text-xs font-medium text-emerald-700">
              {paymentLabel}
            </span>
          </span>
        </div>
        {job.payment_method === "cash" && job.payment_status === "unpaid" ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Please pay the driver {formatMoney(Number(job.fee_amount))} in cash
            when the trip starts.
          </p>
        ) : null}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Pickup
          </p>
          <p className="mt-1">{job.pickup_landmark}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Dropoff
          </p>
          <p className="mt-1">{job.dropoff_landmark}</p>
        </div>
        {job.drivers && (
          <div className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Your driver
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="font-semibold">
                {job.drivers.full_name} · ★{job.drivers.rating_avg.toFixed(1)} (
                {job.drivers.rating_count})
              </p>
              <DriverVerifiedBadge
                verified={isDriverTrustVerified(job.drivers)}
              />
            </div>
            <a
              href={`tel:${job.drivers.phone}`}
              className="mt-1 inline-block text-sm text-sky-700 underline"
            >
              Call driver
            </a>
          </div>
        )}
      </div>

      {job.status === "completed" && !rating && (
        <div className="ru-card space-y-3 p-5">
          <h2 className="font-semibold">Rate your driver</h2>
          <p className="text-xs text-slate-500">
            Honest ratings keep Village Ride safe for everyone.
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className={`h-10 w-10 rounded-full text-sm font-bold ${
                  stars >= n
                    ? "bg-amber-400 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            className="ru-input"
            placeholder="Optional comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            onClick={submitRating}
            className="ru-btn ru-btn-primary w-full"
          >
            Submit rating
          </button>
        </div>
      )}

      {rating && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          You rated ★{rating.stars}
          {rating.comment ? ` — “${rating.comment}”` : ""}
        </p>
      )}
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
