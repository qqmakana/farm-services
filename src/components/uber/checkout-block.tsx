"use client";

import { useState } from "react";
import {
  bookingWhatsAppHref,
  type BookingWhatsAppDraft,
} from "@/lib/brand";
import { driverOptInNote } from "@/lib/night-fare";
import type { NewJobInput, ServiceType, VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

type Draft = Omit<NewJobInput, "payment">;
type PayChoice = "cash" | "card";

function detailsFromDraft(d: Draft): string {
  const when = d.scheduled_for
    ? new Date(d.scheduled_for).toLocaleString("en-ZA", {
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
  serviceType,
  isNightRide = false,
  baseFee,
  nightSurchargeAmount = 0,
}: {
  fee: number;
  vehicle: VehicleType;
  ready: boolean;
  draft: () => Draft;
  /** Kept for call-site compatibility; CTA is WhatsApp. */
  buttonLabel?: string;
  description?: string;
  serviceType: ServiceType;
  isNightRide?: boolean;
  baseFee?: number;
  nightSurchargeAmount?: number;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayChoice>("cash");

  const optIn = driverOptInNote(serviceType, isNightRide);

  function openWhatsAppBooking() {
    setFormError(null);
    if (!ready) {
      setFormError("Complete the form first.");
      return;
    }
    const d = draft();
    const payload: BookingWhatsAppDraft = {
      service_type: d.service_type,
      pickup_landmark: d.pickup_landmark,
      dropoff_landmark: d.dropoff_landmark,
      customer_name: d.customer_name,
      customer_phone: d.customer_phone,
      detailsLine: detailsFromDraft(d),
      paymentLabel: payMethod === "cash" ? "Cash" : "Card",
      estimateZar: fee,
    };
    window.open(bookingWhatsAppHref(payload), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Price estimate
          </p>
          <p className="text-2xl font-bold text-[#1A4D3A]">
            R{Number.isFinite(fee) ? fee : "—"}
          </p>
          {isNightRide && baseFee != null ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Base R{baseFee} + after-hours R{nightSurchargeAmount}
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
          Preferred payment
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              { id: "cash" as const, label: "Cash", hint: "Pay the driver" },
              {
                id: "card" as const,
                label: "Card",
                hint: "Arrange with dispatch",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPayMethod(opt.id)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                payMethod === opt.id
                  ? "border-[#1A4D3A] bg-[#E8F5E9] shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block text-sm font-bold text-[#1A4D3A]">
                {opt.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {formError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {formError}
        </p>
      ) : null}

      <p className="rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-2.5 text-xs leading-relaxed text-slate-700">
        Once you send this WhatsApp, our dispatch team will confirm your driver
        within 5 minutes.
      </p>

      <button
        type="button"
        disabled={!ready}
        onClick={openWhatsAppBooking}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A4D3A] px-4 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#163d2e] disabled:opacity-50"
      >
        <WhatsAppIcon />
        Send Booking via WhatsApp
      </button>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
