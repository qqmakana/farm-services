"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  bookingWhatsAppHref,
  type BookingWhatsAppDraft,
} from "@/lib/brand";
import { createCashJob } from "@/lib/actions";
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
  buttonLabel = "Request",
  serviceType,
  isNightRide = false,
  baseFee,
  nightSurchargeAmount = 0,
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
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayChoice>("cash");
  const [pending, startTransition] = useTransition();

  const optIn = driverOptInNote(serviceType, isNightRide);

  function requestJob() {
    setFormError(null);
    if (!ready) {
      setFormError("Complete the form first.");
      return;
    }
    startTransition(async () => {
      try {
        const job = await createCashJob(draft());
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
                hint: "Arrange with driver",
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
        We&apos;ll find the best available driver and ping them. You&apos;ll see
        live updates on the next screen.
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
