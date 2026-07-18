"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PayPalCheckout } from "@/components/paypal-checkout";
import {
  capturePayPalAndCreateJob,
  createCashJob,
  createLocalPaidJob,
  createPayPalOrderAction,
} from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { driverOptInNote } from "@/lib/night-fare";
import type { NewJobInput, ServiceType, VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

type Draft = Omit<NewJobInput, "payment">;
type PayChoice = "card" | "cash";

export function CheckoutBlock({
  fee,
  vehicle,
  ready,
  draft,
  buttonLabel,
  description,
  serviceType,
  isNightRide = false,
  baseFee,
  nightSurchargeAmount = 0,
}: {
  fee: number;
  vehicle: VehicleType;
  ready: boolean;
  draft: () => Draft;
  buttonLabel: string;
  description: string;
  serviceType: ServiceType;
  isNightRide?: boolean;
  baseFee?: number;
  nightSurchargeAmount?: number;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayChoice>("cash");
  const [pending, startTransition] = useTransition();

  function goToTrip(code: string) {
    router.push(`/trip/${code}`);
    router.refresh();
  }

  const optIn = driverOptInNote(serviceType, isNightRide);

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
        <p className="text-sm font-semibold text-[#1A4D3A]">Payment method</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              { id: "cash" as const, label: "Cash", hint: "Pay the driver" },
              {
                id: "card" as const,
                label: "PayPal / Card",
                hint: "Pay online now",
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

      {payMethod === "cash" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Please pay the driver{" "}
            <strong>{formatMoney(fee || 0)}</strong> in cash when the trip
            starts.
          </div>
          <button
            type="button"
            disabled={!ready || pending}
            onClick={() => {
              setFormError(null);
              if (!ready) {
                setFormError("Complete the form first.");
                return;
              }
              startTransition(async () => {
                try {
                  const job = await createCashJob(draft());
                  goToTrip(job.reference_code);
                } catch (err) {
                  setFormError(
                    err instanceof Error ? err.message : "Could not book",
                  );
                }
              });
            }}
            className="w-full rounded-xl bg-[#1A4D3A] px-4 py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {pending ? "Booking…" : `${buttonLabel} · Cash`}
          </button>
        </div>
      ) : (
        <PayPalCheckout
          amount={fee || 0}
          description={description}
          submitLabel={buttonLabel}
          disabled={!ready}
          onCreateOrder={async () => {
            setFormError(null);
            if (!ready) throw new Error("Complete the form first.");
            const d = draft();
            const { orderId } = await createPayPalOrderAction({
              vehicle: d.required_vehicle,
              pickup_lat: d.pickup_lat,
              pickup_lng: d.pickup_lng,
              dropoff_lat: d.dropoff_lat,
              dropoff_lng: d.dropoff_lng,
              at: d.scheduled_for ?? null,
              description,
            });
            return orderId;
          }}
          onApprove={async (orderId) => {
            setFormError(null);
            try {
              const job = await capturePayPalAndCreateJob(orderId, draft());
              goToTrip(job.reference_code);
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
            const job = await createLocalPaidJob(draft());
            goToTrip(job.reference_code);
          }}
        />
      )}
    </div>
  );
}
