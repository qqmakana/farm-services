"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignDriver, rematchJob, updateJobStatus } from "@/lib/actions";
import {
  formatMoney,
  formatWhen,
  serviceBadgeClass,
  SERVICE_LABELS,
  statusBadgeClass,
  STATUS_LABELS,
} from "@/lib/format";
import { jobNeedsFromJob, needsBadges } from "@/lib/job-needs";
import type { Driver, JobStatus, JobWithDriver } from "@/lib/types";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { vehicleFitsJob, VEHICLE_LABELS } from "@/lib/vehicles";

type OpsFilter =
  | "all"
  | "new"
  | "active"
  | "done"
  | "night"
  | "scheduled"
  | "heavy"
  | "cash";

const STATUSES: JobStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
];

function detailsSummary(job: JobWithDriver) {
  const d = job.details as Record<string, unknown>;
  if (job.service_type === "ride") {
    return `${d.route_name ?? "Route"} · ${d.seats ?? "?"} seats · ${d.direction ?? ""}`;
  }
  if (job.service_type === "delivery") {
    return `${d.item_description ?? "Item"} · ${d.size ?? "?"} · helpers: ${d.needs_helpers ? "yes" : "no"}`;
  }
  if (job.service_type === "farm" && Array.isArray(d.items)) {
    return (d.items as Array<{ name: string; qty: number }>)
      .map((i) => `${i.qty}× ${i.name}`)
      .join(", ");
  }
  return "—";
}

export function DispatchBoard({
  jobs,
  drivers,
}: {
  jobs: JobWithDriver[];
  drivers: Driver[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OpsFilter>("all");

  const filtered = jobs.filter((job) => {
    const needs = jobNeedsFromJob(job);
    if (filter === "new") return job.status === "new";
    if (filter === "active")
      return job.status === "assigned" || job.status === "in_progress";
    if (filter === "done")
      return job.status === "completed" || job.status === "cancelled";
    if (filter === "night") return needs.night;
    if (filter === "scheduled") return needs.scheduled;
    if (filter === "heavy") return needs.heavy;
    if (filter === "cash") return job.payment_method === "cash";
    return true;
  });

  function onAssign(jobId: string, driverId: string) {
    if (!driverId) return;
    setError(null);
    startTransition(async () => {
      try {
        await assignDriver(jobId, driverId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Assign failed");
      }
    });
  }

  function onStatus(jobId: string, status: JobStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateJobStatus(jobId, status);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  function onRematch(jobId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await rematchJob(jobId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Rematch failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["new", "Unassigned"],
            ["active", "Active"],
            ["night", "Night"],
            ["scheduled", "Scheduled"],
            ["heavy", "Heavy loads"],
            ["cash", "Cash"],
            ["done", "Done"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              filter === key
                ? "bg-[#1A4D3A] text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            {label}
          </button>
        ))}
        {pending && (
          <span className="text-sm text-stone-500">Saving…</span>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
          No jobs in this view.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((job) => {
            const driver = job.drivers;
            const wa =
              driver != null ? buildWhatsAppLink(job, driver) : null;
            const badges = needsBadges(jobNeedsFromJob(job));

            return (
              <li
                key={job.id}
                className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-stone-800">
                        {job.reference_code}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${serviceBadgeClass(job.service_type)}`}
                      >
                        {SERVICE_LABELS[job.service_type]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(job.status)}`}
                      >
                        {STATUS_LABELS[job.status]}
                      </span>
                      {badges.map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-[#1A4D3A] px-2 py-0.5 text-xs font-semibold text-white"
                        >
                          {b}
                        </span>
                      ))}
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800">
                        Needs {VEHICLE_LABELS[job.required_vehicle]}
                      </span>
                      {job.match_score != null ? (
                        <span
                          className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-900"
                          title={
                            job.match_breakdown
                              ? JSON.stringify(job.match_breakdown)
                              : "Smart dispatch score"
                          }
                        >
                          Match {Number(job.match_score).toFixed(0)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {job.customer_name} · {job.customer_phone}
                    </p>
                    <p className="mt-1 text-sm text-stone-700">
                      {detailsSummary(job)}
                    </p>
                  </div>
                    <div className="text-right text-sm">
                    <p className="font-semibold text-stone-900">
                      {formatMoney(Number(job.fee_amount))}
                    </p>
                    <p className="text-emerald-700">
                      {job.payment_method === "cash"
                        ? job.payment_status === "cash_collected"
                          ? "Cash collected"
                          : "Cash — unpaid"
                        : job.payment_status === "paid_online"
                          ? job.payment_method === "paypal"
                            ? "Paid · PayPal"
                            : `Paid · card ••${job.card_last4 ?? "****"}`
                          : "Payment pending"}
                    </p>
                    <p className="text-stone-500">{formatWhen(job.scheduled_for)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-stone-900">Pickup: </span>
                    {job.pickup_landmark}
                    {job.pickup_lat != null && job.pickup_lng != null && (
                      <a
                        className="ml-1 text-emerald-800 underline"
                        href={`https://maps.google.com/?q=${job.pickup_lat},${job.pickup_lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        pin
                      </a>
                    )}
                  </p>
                  <p>
                    <span className="font-medium text-stone-900">Dropoff: </span>
                    {job.dropoff_landmark}
                    {job.dropoff_lat != null && job.dropoff_lng != null && (
                      <a
                        className="ml-1 text-emerald-800 underline"
                        href={`https://maps.google.com/?q=${job.dropoff_lat},${job.dropoff_lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        pin
                      </a>
                    )}
                  </p>
                </div>

                {job.dispatcher_notes && (
                  <p className="mt-2 text-sm text-stone-600">
                    Notes: {job.dispatcher_notes}
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-medium text-stone-600">
                    Assign driver
                    <select
                      className="rounded-md border border-stone-300 bg-white px-2 py-2 text-sm text-stone-900"
                      defaultValue={job.driver_id ?? ""}
                      onChange={(e) => onAssign(job.id, e.target.value)}
                      disabled={pending}
                    >
                      <option value="">Select driver…</option>
                      {drivers
                        .filter((d) =>
                          vehicleFitsJob(d.vehicle_type, job.required_vehicle),
                        )
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.full_name} · {VEHICLE_LABELS[d.vehicle_type]}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="flex min-w-[160px] flex-col gap-1 text-xs font-medium text-stone-600">
                    Status
                    <select
                      className="rounded-md border border-stone-300 bg-white px-2 py-2 text-sm text-stone-900"
                      value={job.status}
                      onChange={(e) =>
                        onStatus(job.id, e.target.value as JobStatus)
                      }
                      disabled={pending}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>

                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe57]"
                    >
                      WhatsApp driver
                    </a>
                  ) : (
                    <span className="self-center text-xs text-stone-400">
                      Assign a driver to enable WhatsApp
                    </span>
                  )}

                  {job.status === "new" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onRematch(job.id)}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Rematch drivers
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
