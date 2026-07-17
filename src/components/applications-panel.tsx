"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptApplication } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import type { JobApplication } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

/** Manual override for a single trip — not the same as hiring a driver. */
export function ApplicationsPanel({
  applications,
}: {
  applications: JobApplication[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pendingApps = applications.filter((a) => a.status === "pending");

  function onAccept(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await acceptApplication(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Accept failed");
      }
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Trip offers (override)
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Optional manual pick when auto-match needs a human. Hiring new drivers
        is above in the hiring queue.
      </p>

      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {pendingApps.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No pending trip offers.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {pendingApps.map((app) => (
            <li
              key={app.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {app.drivers?.full_name ?? "Driver"}{" "}
                  <span className="font-normal text-slate-500">
                    (
                    {app.drivers
                      ? VEHICLE_LABELS[app.drivers.vehicle_type]
                      : "?"}
                    )
                  </span>
                </p>
                <p className="text-slate-600">
                  Job {app.jobs?.reference_code ?? app.job_id.slice(0, 8)} ·{" "}
                  {app.jobs ? formatMoney(Number(app.jobs.fee_amount)) : null}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => onAccept(app.id)}
                className="rounded-md bg-emerald-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Assign this trip
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
