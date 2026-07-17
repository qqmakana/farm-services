"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveDriverHire, rejectDriverHire } from "@/lib/actions";
import type { Driver, DriverApprovalStatus } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

type Filter = "all" | DriverApprovalStatus;

function statusLabel(status: DriverApprovalStatus) {
  switch (status) {
    case "approved":
      return "Approved by app";
    case "pending":
      return "Pending";
    case "rejected":
      return "Rejected";
  }
}

function statusClass(status: DriverApprovalStatus) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-900";
    case "pending":
      return "bg-amber-100 text-amber-950";
    case "rejected":
      return "bg-rose-100 text-rose-900";
  }
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HireQueue({ drivers }: { drivers: Driver[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: drivers.length,
      approved: drivers.filter((d) => d.approval_status === "approved").length,
      pending: drivers.filter((d) => d.approval_status === "pending").length,
      rejected: drivers.filter((d) => d.approval_status === "rejected").length,
    };
  }, [drivers]);

  const visible = useMemo(() => {
    if (filter === "all") return drivers;
    return drivers.filter((d) => d.approval_status === filter);
  }, [drivers, filter]);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Everyone in app", count: counts.all },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <section className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Drivers in the app
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        See everyone who applied in Village Ride. SA numbers are{" "}
        <strong>auto-approved by the app</strong> — you can still override.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              filter === f.key
                ? "bg-[var(--ru-brand)] text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No drivers in this filter yet. They must apply inside the Village Ride
          app (/driver).
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-emerald-100 overflow-hidden rounded-lg border border-emerald-100 bg-white">
          {visible.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{d.full_name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(d.approval_status)}`}
                  >
                    {statusLabel(d.approval_status)}
                  </span>
                  {d.is_online && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900">
                      Online now
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-slate-600">
                  {d.phone} · {VEHICLE_LABELS[d.vehicle_type]}
                  {d.notes ? ` · ${d.notes}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Applied {when(d.created_at)}
                  {d.rating_count > 0
                    ? ` · ${d.rating_avg}★ (${d.rating_count})`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {d.approval_status !== "approved" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => approveDriverHire(d.id))}
                    className="rounded-md bg-emerald-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {d.approval_status !== "rejected" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => rejectDriverHire(d.id, "Removed by ops"))
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
