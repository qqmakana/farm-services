"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useCountry } from "@/components/country/country-provider";
import {
  PaymentSelector,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-selector";
import { PayPalCheckout } from "@/components/paypal-checkout";
import {
  bookingWhatsAppHref,
  type BookingWhatsAppDraft,
} from "@/lib/brand";
import {
  capturePayPalAndCreateJob,
  createCashJob,
  createLocalPaidJob,
  createPayPalOrderAction,
} from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { setGuestProfile } from "@/lib/guest-profile";
import { enqueuePendingBooking } from "@/lib/offline-booking-queue";
import { driverOptInNote } from "@/lib/night-fare";
import { getCapturedReferrer } from "@/lib/rider-referral";
import type { NewJobInput, ServiceType, VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";
import { SubscribeButton } from "@/components/subscription/subscribe-button";

type Draft = Omit<NewJobInput, "payment">;

function withReferralNote(d: Draft): Draft {
  const ref = getCapturedReferrer();
  if (!ref) return d;
  const tag = `Rider referral: ${ref}`;
  const existing = d.dispatcher_notes?.trim();
  if (existing?.includes(tag)) return d;
  return {
    ...d,
    dispatcher_notes: existing ? `${existing} · ${tag}` : tag,
  };
}

function detailsFromDraft(d: Draft, locale: string): string {
  const when = d.scheduled_for
    ? (() => {
        try {
          return new Date(d.scheduled_for).toLocaleString(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          });
        } catch {
          return d.scheduled_for;
        }
      })()
    : "ASAP";

  if (d.service_type === "ride") {
    const seats =
      "seats" in d.details ? Number(d.details.seats) || 1 : 1;
    const wearing =
      "wearing" in d.details && d.details.wearing
        ? String(d.details.wearing)
        : "";
    return [
      `${seats} passenger${seats === 1 ? "" : "s"}`,
      VEHICLE_LABELS[d.required_vehicle],
      when,
      wearing && `wearing ${wearing}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (d.service_type === "delivery" || d.service_type === "courier") {
    const item =
      "item_description" in d.details
        ? String(d.details.item_description || "Package")
        : "Package";
    const size =
      "size" in d.details ? String(d.details.size || "") : "";
    const weightCat =
      "weight_category" in d.details && d.details.weight_category
        ? String(d.details.weight_category)
        : "";
    const weight =
      "item_weight" in d.details && d.details.item_weight
        ? String(d.details.item_weight)
        : "";
    return [
      item,
      weightCat && `weight ${weightCat}`,
      weight && `weight ${weight}`,
      size && `size ${size}`,
      VEHICLE_LABELS[d.required_vehicle],
      when,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const notes =
    "notes" in d.details && d.details.notes
      ? String(d.details.notes)
      : d.product_summary || "Farm load";
  const weightCat =
    "weight_category" in d.details && d.details.weight_category
      ? String(d.details.weight_category)
      : "";
  return [notes, weightCat && `weight ${weightCat}`, VEHICLE_LABELS[d.required_vehicle], when]
    .filter(Boolean)
    .join(" · ");
}

export function CheckoutBlock({
  fee,
  vehicle,
  ready,
  draft,
  buttonLabel = "Book ride",
  serviceType,
  isNightRide = false,
  baseFee,
  nightSurchargeAmount = 0,
  currency,
  compact = false,
  onSchedule,
  reservationFee = 0,
}: {
  fee: number;
  vehicle: VehicleType;
  ready: boolean;
  draft: () => Draft | Promise<Draft>;
  buttonLabel?: string;
  description?: string;
  serviceType: ServiceType;
  isNightRide?: boolean;
  baseFee?: number;
  nightSurchargeAmount?: number;
  currency?: string;
  /** Uber-style: payment + CTA only, no walls of text */
  compact?: boolean;
  onSchedule?: () => void;
  reservationFee?: number;
}) {
  const router = useRouter();
  const { country, countryCode } = useCountry();
  const [payMethod, setPayMethod] = useState<CheckoutPaymentChoice>("cash");
  const [formError, setFormError] = useState<string | null>(null);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("village_ride_last_pay_method");
      if (saved === "cash" || saved === "card") setPayMethod(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function choosePay(next: CheckoutPaymentChoice) {
    setPayMethod(next);
    try {
      window.localStorage.setItem("village_ride_last_pay_method", next);
    } catch {
      /* ignore */
    }
  }

  const displayCurrency = currency || country.currency;

  const optIn = driverOptInNote(serviceType, isNightRide);

  function saveGuest(d: Draft) {
    setGuestProfile({
      name: d.customer_name,
      phone: d.customer_phone,
      country_code: countryCode,
    });
  }

  function queueOffline(d: Draft) {
    enqueuePendingBooking({
      ...withReferralNote(d),
      country_code: d.country_code || countryCode,
    });
    setQueuedOffline(true);
    setFormError(null);
  }

  async function buildDraft(): Promise<Draft> {
    const d = withReferralNote(await draft());
    return {
      ...d,
      country_code: d.country_code || countryCode,
    };
  }

  function requestCashJob() {
    setFormError(null);
    setQueuedOffline(false);
    if (!ready) {
      setFormError("Complete the form first.");
      return;
    }
    startTransition(async () => {
      try {
        const d = await buildDraft();
        saveGuest(d);
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          queueOffline(d);
          return;
        }
        const job = await createCashJob(d);
        router.push(`/trip/${job.reference_code}`);
        router.refresh();
      } catch (err) {
        const offline =
          typeof navigator !== "undefined" && navigator.onLine === false;
        const raw = err instanceof Error ? err.message : "Could not book";
        const msg =
          /Server Components|digest|omitted in production|Body exceeded|413/i.test(
            raw,
          )
            ? "Could not create your trip. Check your connection and try again — or use WhatsApp booking."
            : raw;
        const looksNetwork =
          /fetch|network|failed to fetch|load failed|offline/i.test(raw);
        if (offline || looksNetwork) {
          try {
            const d = await buildDraft();
            saveGuest(d);
            queueOffline(d);
            return;
          } catch {
            /* fall through */
          }
        }
        setFormError(msg);
      }
    });
  }

  function openWhatsAppBooking() {
    setFormError(null);
    if (!ready) {
      setFormError("Complete the form first.");
      return;
    }
    void (async () => {
      const d = await buildDraft();
      saveGuest(d);
      const payload: BookingWhatsAppDraft = {
        service_type: d.service_type,
        pickup_landmark: d.pickup_landmark,
        dropoff_landmark: d.dropoff_landmark,
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        detailsLine: detailsFromDraft(d, country.locale),
        paymentLabel: payMethod === "card" ? "Card" : "Cash",
        estimateZar: fee,
        currencySymbol: country.currencySymbol,
      };
      window.open(bookingWhatsAppHref(payload), "_blank", "noopener,noreferrer");
    })();
  }

  return (
    <div
      className={`space-y-3 bg-white text-black ${
        compact ? "pt-2" : "border-t border-gray-100 pt-4"
      }`}
    >
      {!compact ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Price estimate
            </p>
            <p
              data-testid="price-display"
              className="text-2xl font-bold text-black"
            >
              {Number.isFinite(fee)
                ? formatMoney(fee, displayCurrency, countryCode)
                : "—"}
            </p>
            {isNightRide && baseFee != null ? (
              <p className="mt-0.5 text-xs text-gray-500">
                Driver fare{" "}
                {formatMoney(
                  baseFee + nightSurchargeAmount,
                  displayCurrency,
                  countryCode,
                )}{" "}
                (base + after-hours)
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-gray-500">
                Includes 10% platform fee · driver keeps 90%
              </p>
            )}
            {reservationFee > 0 ? (
              <p
                data-testid="reservation-fee-line"
                className="mt-0.5 text-xs font-medium text-gray-700"
              >
                Includes{" "}
                {formatMoney(reservationFee, displayCurrency, countryCode)}{" "}
                reservation fee
              </p>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">{VEHICLE_LABELS[vehicle]}</p>
        </div>
      ) : (
        <>
          <p data-testid="price-display" className="sr-only">
            {Number.isFinite(fee)
              ? formatMoney(fee, displayCurrency, countryCode)
              : "—"}
          </p>
          {reservationFee > 0 ? (
            <p
              data-testid="reservation-fee-line"
              className="text-xs font-medium text-gray-700"
            >
              Includes {formatMoney(reservationFee, displayCurrency, countryCode)}{" "}
              reservation fee
            </p>
          ) : null}
        </>
      )}

      {isNightRide ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
          Night Ride
        </div>
      ) : null}

      {!compact ? (
        <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-black">
          {optIn}
        </p>
      ) : null}

      <PaymentSelector
        compact={compact}
        value={payMethod}
        onChange={choosePay}
        currencyLabel={country.currencySymbol}
      />

      {!compact ? <SubscribeButton compact /> : null}

      {!compact && payMethod === "cash" ? (
        <div
          data-testid="cash-payment-message"
          className="rounded-2xl bg-gray-50 px-3 py-3"
        >
          <p className="text-sm font-semibold text-black">
            Pay the driver in cash
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Pay the driver the full total at pickup or dropoff. Village Ride
            takes only the small platform fee from the driver&apos;s wallet
            after the trip (waived with Village Pass).
          </p>
        </div>
      ) : null}

      {compact && payMethod === "cash" ? (
        <p data-testid="cash-payment-message" className="sr-only">
          Pay the driver in cash
        </p>
      ) : null}

      {!compact && payMethod === "card" ? (
        <div
          data-testid="card-payment-message"
          className="rounded-2xl bg-gray-50 px-3 py-3"
        >
          <p className="text-sm font-semibold text-black">Pay with card</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Pay the full fare now with PayPal. When the trip completes, the
            driver is credited the fare minus the platform fee — same split as
            cash.
          </p>
        </div>
      ) : null}

      {compact && payMethod === "card" ? (
        <p data-testid="card-payment-message" className="sr-only">
          Pay with card via PayPal
        </p>
      ) : null}

      {queuedOffline ? (
        <div className="space-y-2 rounded-2xl bg-gray-50 px-3 py-3 text-sm text-black">
          <p className="font-semibold">Saved on this phone (offline)</p>
          <p className="text-xs leading-relaxed text-gray-500">
            Cash bookings can queue offline and send when you have signal. Card
            payments need an internet connection.
          </p>
          <button
            type="button"
            onClick={() => router.push("/activity")}
            className="uber-press text-xs font-semibold underline"
          >
            View activity
          </button>
        </div>
      ) : null}

      {formError ? (
        <div className="space-y-2 rounded-2xl bg-[#fdecea] px-3 py-3 text-sm text-[#b01000]">
          <p>{formError}</p>
          <button
            type="button"
            onClick={openWhatsAppBooking}
            className="uber-press font-semibold underline"
          >
            Try WhatsApp booking instead
          </button>
        </div>
      ) : null}

      {!compact ? (
        <p className="rounded-2xl bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
          We&apos;ll find the best available driver and ping them. You&apos;ll
          see live updates — photos, plate, and status — on the next screen.
        </p>
      ) : null}

      <div
        className={`sticky bottom-0 z-10 space-y-2 bg-white pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] ${
          compact ? "-mx-4 border-t border-[#e8e8e8] px-4" : "-mx-4 border-t border-gray-100 px-4"
        }`}
      >
        {payMethod === "cash" ? (
          <div className={compact ? "flex items-center gap-2" : undefined}>
            <button
              type="button"
              data-testid="book-button"
              disabled={!ready || pending}
              onClick={requestCashJob}
              className="uber-press uber-btn-black min-w-0 flex-1"
            >
              {pending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Finding driver…
                </>
              ) : (
                buttonLabel
              )}
            </button>
            {compact && onSchedule ? (
              <button
                type="button"
                onClick={onSchedule}
                className="uber-press flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-[#D2D2D2] bg-white text-black"
                style={{ height: "3.25rem", width: "3.25rem" }}
                aria-label="Schedule for later"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 3v4M16 3v4" />
                </svg>
              </button>
            ) : null}
          </div>
        ) : (
          <PayPalCheckout
            amount={Number(fee) || 0}
            description={`${VEHICLE_LABELS[vehicle]} · Village Ride`}
            disabled={!ready}
            submitLabel={buttonLabel}
            onCreateOrder={async () => {
              setFormError(null);
              if (!ready) throw new Error("Complete the form first.");
              const d = await buildDraft();
              saveGuest(d);
              const { orderId } = await createPayPalOrderAction({
                vehicle,
                service_type: serviceType,
                country_code: d.country_code || countryCode,
                customer_phone: d.customer_phone,
                pickup_lat: d.pickup_lat,
                pickup_lng: d.pickup_lng,
                dropoff_lat: d.dropoff_lat,
                dropoff_lng: d.dropoff_lng,
                description: `Village Ride ${serviceType} · ${VEHICLE_LABELS[vehicle]}`,
                at: d.scheduled_for ?? null,
                details: d.details,
              });
              return orderId;
            }}
            onApprove={async (orderId) => {
              setFormError(null);
              try {
                const d = await buildDraft();
                saveGuest(d);
                const job = await capturePayPalAndCreateJob(orderId, d);
                router.push(`/trip/${job.reference_code}`);
                router.refresh();
              } catch (err) {
                setFormError(
                  err instanceof Error ? err.message : "Payment failed",
                );
                throw err;
              }
            }}
            onLocalPay={async () => {
              setFormError(null);
              if (!ready) throw new Error("Complete the form first.");
              const d = await buildDraft();
              saveGuest(d);
              const job = await createLocalPaidJob(d);
              router.push(`/trip/${job.reference_code}`);
              router.refresh();
            }}
          />
        )}

        {compact ? null : (
          <button
            type="button"
            disabled={!ready || pending}
            onClick={openWhatsAppBooking}
            className="uber-press uber-btn-soft w-full"
          >
            Or send booking via WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
