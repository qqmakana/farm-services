"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useCountry } from "@/components/country/country-provider";
import {
  bookingWhatsAppHref,
  type BookingWhatsAppDraft,
} from "@/lib/brand";
import { createCashJob } from "@/lib/actions";
import {
  paymentHint,
  paymentLabel,
  type PaymentMethodId,
} from "@/lib/countries";
import { formatMoney } from "@/lib/format";
import { setGuestProfile } from "@/lib/guest-profile";
import { driverOptInNote } from "@/lib/night-fare";
import type { NewJobInput, ServiceType, VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

type Draft = Omit<NewJobInput, "payment">;

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
    return `${seats} passenger${seats === 1 ? "" : "s"} · ${VEHICLE_LABELS[d.required_vehicle]} · ${when}`;
  }

  if (d.service_type === "delivery") {
    const item =
      "item_description" in d.details
        ? String(d.details.item_description || "Goods")
        : "Goods";
    const size =
      "size" in d.details ? String(d.details.size || "") : "";
    return [item, size && `size ${size}`, VEHICLE_LABELS[d.required_vehicle], when]
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
  draft: () => Draft;
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
  const [payMethod, setPayMethod] = useState<PaymentMethodId>("cash");
  const [pending, startTransition] = useTransition();

  const methods = useMemo(() => country.payments, [country.payments]);
  const displayCurrency = currency || country.currency;

  const optIn = driverOptInNote(serviceType, isNightRide);

  function requestJob() {
    setFormError(null);
    if (!ready) {
      setFormError("Complete the form first.");
      return;
    }
    startTransition(async () => {
      try {
        const d = draft();
        setGuestProfile({
          name: d.customer_name,
          phone: d.customer_phone,
          country_code: countryCode,
        });
        const job = await createCashJob({
          ...d,
          country_code: d.country_code || countryCode,
        });
        router.push(`/trip/${job.reference_code}`);
        router.refresh();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Could not book");
      }
    });
  }

  function openWhatsAppBooking() {
    setFormError(null);
    if (!ready) {
      setFormError("Complete the form first.");
      return;
    }
    const d = draft();
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
      paymentLabel: payMethod === "cash" ? "Cash" : "Card",
      estimateZar: fee,
      currencySymbol: country.currencySymbol,
    };
    window.open(bookingWhatsAppHref(payload), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-3 border-t border-slate-100 bg-white pt-4 text-slate-900">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Price estimate
          </p>
          <p className="text-2xl font-bold text-[#1A4D3A]">
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
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1A4D3A] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
          <span aria-hidden>🌙</span>
          Night Ride (Premium)
        </div>
      ) : null}

      <p className="rounded-xl border border-[#1A4D3A]/15 bg-[#E8F5E9] px-3 py-2.5 text-xs leading-relaxed text-[#1A4D3A]">
        {optIn}
      </p>

      <div>
        <p className="text-sm font-semibold text-[#1A4D3A]">
          How you&apos;ll pay the driver
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {methods.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPayMethod(id)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                payMethod === id
                  ? "border-[#1A4D3A] bg-[#E8F5E9] shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block text-sm font-bold text-[#1A4D3A]">
                {paymentLabel(id)}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {id === "cash"
                  ? "Pay driver in person (recommended)"
                  : paymentHint(id)}
              </span>
            </button>
          ))}
        </div>
        {payMethod !== "cash" ? (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
            In-app {paymentLabel(payMethod)} isn&apos;t live yet.{" "}
            <strong>Request</strong> still books as cash to the driver — or use
            WhatsApp below to ask for another payment option.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            You pay the driver in cash. Village Ride takes ~15% from the
            driver&apos;s prepaid wallet — not from you.
          </p>
        )}
      </div>

      {formError ? (
        <div className="space-y-2 rounded-xl bg-rose-50 px-3 py-3 text-sm text-rose-800">
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

      <p className="rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-2.5 text-xs leading-relaxed text-slate-700">
        We&apos;ll find the best available driver and ping them. You&apos;ll see
        live updates — photos, plate, and status — on the next screen.
      </p>

      <button
        type="button"
        disabled={!ready || pending}
        onClick={requestJob}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A4D3A] px-4 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#163d2e] disabled:opacity-50"
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
        className="w-full rounded-xl border border-[#1A4D3A]/30 bg-white px-4 py-3 text-sm font-semibold text-[#1A4D3A] disabled:opacity-50"
      >
        Or send booking via WhatsApp
      </button>
    </div>
  );
}
