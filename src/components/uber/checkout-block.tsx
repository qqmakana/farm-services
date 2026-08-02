"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCountry } from "@/components/country/country-provider";
import {
  bookingWhatsAppHref,
  type BookingWhatsAppDraft,
} from "@/lib/brand";
import { createCashJob } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { setGuestProfile } from "@/lib/guest-profile";
import { enqueuePendingBooking } from "@/lib/offline-booking-queue";
import { driverOptInNote } from "@/lib/night-fare";
import { getCapturedReferrer } from "@/lib/rider-referral";
import type { NewJobInput, ServiceType, VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

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
    ? new Date(d.scheduled_for).toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
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
    const weight =
      "item_weight" in d.details && d.details.item_weight
        ? String(d.details.item_weight)
        : "";
    return [
      item,
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
  return `${notes} · ${VEHICLE_LABELS[d.required_vehicle]} · ${when}`;
}

export function CheckoutBlock({
  fee,
  vehicle,
  ready,
  draft,
  buttonLabel = "Request",
  serviceType,
  isNightRide = false,
  baseFee,
  nightSurchargeAmount = 0,
  currency,
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
}) {
  const router = useRouter();
  const { country, countryCode } = useCountry();
  const [formError, setFormError] = useState<string | null>(null);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [pending, startTransition] = useTransition();

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

  function requestJob() {
    setFormError(null);
    setQueuedOffline(false);
    if (!ready) {
      setFormError("Complete the form first.");
      return;
    }
    startTransition(async () => {
      try {
        const d = withReferralNote(await draft());
        saveGuest(d);
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          queueOffline(d);
          return;
        }
        const job = await createCashJob({
          ...d,
          country_code: d.country_code || countryCode,
        });
        router.push(`/trip/${job.reference_code}`);
        router.refresh();
      } catch (err) {
        const offline =
          typeof navigator !== "undefined" && navigator.onLine === false;
        const msg = err instanceof Error ? err.message : "Could not book";
        const looksNetwork =
          /fetch|network|failed to fetch|load failed|offline/i.test(msg);
        if (offline || looksNetwork) {
          try {
            const d = withReferralNote(await draft());
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
      const d = await draft();
      setGuestProfile({
        name: d.customer_name,
        phone: d.customer_phone,
        country_code: countryCode,
      });
      const payload: BookingWhatsAppDraft = {
        service_type: d.service_type,
        pickup_landmark: d.pickup_landmark,
        dropoff_landmark: d.dropoff_landmark,
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        detailsLine: detailsFromDraft(d, country.locale),
        paymentLabel: "Cash",
        estimateZar: fee,
        currencySymbol: country.currencySymbol,
      };
      window.open(bookingWhatsAppHref(payload), "_blank", "noopener,noreferrer");
    })();
  }

  return (
    <div className="space-y-3 border-t border-slate-100 bg-white pt-4 text-slate-900">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Price estimate
          </p>
          <p className="text-2xl font-bold text-[#000000]">
            {Number.isFinite(fee)
              ? formatMoney(fee, displayCurrency, countryCode)
              : "—"}
          </p>
          {isNightRide && baseFee != null ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Base {formatMoney(baseFee, displayCurrency, countryCode)} +
              after-hours{" "}
              {formatMoney(nightSurchargeAmount, displayCurrency, countryCode)}
            </p>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">{VEHICLE_LABELS[vehicle]}</p>
      </div>

      {isNightRide ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-[#000000] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
          <span aria-hidden>🌙</span>
          Night Ride (Premium)
        </div>
      ) : null}

      <p className="rounded-xl border border-[#000000]/15 bg-[#f5f5f5] px-3 py-2.5 text-xs leading-relaxed text-[#000000]">
        {optIn}
      </p>

      <div className="rounded-2xl border border-[var(--ru-line)] bg-[var(--ru-elevated)] px-3 py-3">
        <p className="text-sm font-semibold text-black">Pay the driver in cash</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ru-muted)]">
          At pickup or dropoff — simple and reliable. Village Ride takes ~15%
          from the driver&apos;s prepaid wallet, not from you. Card and mobile
          money are coming later.
        </p>
      </div>

      {queuedOffline ? (
        <div className="space-y-2 rounded-2xl border border-[var(--ru-line)] bg-[var(--ru-elevated)] px-3 py-3 text-sm text-black">
          <p className="font-semibold">Saved on this phone (offline)</p>
          <p className="text-xs leading-relaxed text-[var(--ru-muted)]">
            Your landmark booking is stored here and will send automatically
            when you have signal — GPS not required.
          </p>
          <button
            type="button"
            onClick={() => router.push("/activity")}
            className="text-xs font-semibold underline"
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
            className="font-semibold underline"
          >
            Try WhatsApp booking instead
          </button>
        </div>
      ) : null}

      <p className="rounded-2xl border border-[var(--ru-line)] bg-[var(--ru-elevated)] px-3 py-2.5 text-xs leading-relaxed text-[var(--ru-muted)]">
        We&apos;ll find the best available driver and ping them. You&apos;ll see
        live updates — photos, plate, and status — on the next screen.
      </p>

      <button
        type="button"
        disabled={!ready || pending}
        onClick={requestJob}
        className="ru-btn ru-btn-primary ru-btn-block"
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

      <button
        type="button"
        disabled={!ready || pending}
        onClick={openWhatsAppBooking}
        className="ru-btn ru-btn-secondary ru-btn-block"
      >
        Or send booking via WhatsApp
      </button>
    </div>
  );
}
