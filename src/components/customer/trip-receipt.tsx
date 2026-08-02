"use client";

import { formatMoney, SERVICE_LABELS, STATUS_LABELS } from "@/lib/format";
import type { JobWithDriver } from "@/lib/types";

type Props = {
  job: JobWithDriver;
  onClose: () => void;
};

/** Simple printable / shareable trip receipt. */
export function TripReceipt({ job, onClose }: Props) {
  const fee = Number(job.fee_amount) || 0;
  const when = new Date(job.completed_at || job.created_at).toLocaleString(
    "en-ZA",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
  const driverName = job.drivers?.full_name || "—";

  function printReceipt() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-label="Trip receipt"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl print:max-h-none print:shadow-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Receipt
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-black">
              {job.reference_code}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 print:hidden"
          >
            Close
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Date</dt>
            <dd className="font-medium text-black">{when}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Service</dt>
            <dd className="font-medium text-black">
              {SERVICE_LABELS[job.service_type]}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-black">
              {STATUS_LABELS[job.status]}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Driver</dt>
            <dd className="font-medium text-black">{driverName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Payment</dt>
            <dd className="font-medium text-black">
              {job.payment_method === "cash" ? "Cash to driver" : job.payment_method || "—"}
            </dd>
          </div>
          <div className="border-t border-slate-100 pt-2">
            <dt className="text-slate-500">Pickup</dt>
            <dd className="font-medium text-black">{job.pickup_landmark}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Dropoff</dt>
            <dd className="font-medium text-black">{job.dropoff_landmark}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
            <dt className="text-base font-bold text-black">Total</dt>
            <dd className="text-base font-bold text-black">
              {formatMoney(fee, job.fee_currency)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={printReceipt}
            className="flex-1 rounded-xl bg-black py-3 text-sm font-bold text-white"
          >
            Download / Print
          </button>
          <a
            href={`/trip/${job.reference_code}`}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-black"
          >
            Open trip
          </a>
        </div>
      </div>
    </div>
  );
}
