"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveDriverHire, rejectDriverHire } from "@/lib/actions";
import type { Driver } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

export function HireQueue({ applicants }: { applicants: Driver[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Driver hiring
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        South African mobiles are <strong>auto-approved</strong> when they
        apply. This queue is for rare manual cases only — override if needed.
      </p>

      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {applicants.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No pending applications. New SA drivers go straight to approved.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {applicants.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {d.full_name}{" "}
                  <span className="font-normal text-slate-500">
                    · {VEHICLE_LABELS[d.vehicle_type]}
                  </span>
                </p>
                <p className="text-slate-600">
                  {d.phone}
                  {d.notes ? ` · ${d.notes}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => approveDriverHire(d.id))}
                  className="rounded-md bg-emerald-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(() => rejectDriverHire(d.id, "Not suitable"))
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
