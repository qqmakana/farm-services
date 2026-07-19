"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  completeTrip,
  listDriverActiveJob,
  listDriverJobs,
  startTrip,
} from "@/lib/actions";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import {
  formatMoney,
  SERVICE_LABELS,
  STATUS_LABELS,
} from "@/lib/format";
import type { JobStatus, JobWithDriver } from "@/lib/types";

type Segment = "active" | "completed" | "cancelled";

const ACTIVE: JobStatus[] = ["confirmed", "assigned", "in_progress"];

export function DriverJobsView() {
  const { driverId, refresh } = useDriverApp();
  const [segment, setSegment] = useState<Segment>("active");
  const [active, setActive] = useState<JobWithDriver | null>(null);
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    if (!driverId) return;
    const [a, all] = await Promise.all([
      listDriverActiveJob(driverId),
      listDriverJobs(driverId),
    ]);
    setActive(a);
    setJobs(all);
  }, [driverId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  const list = useMemo(() => {
    if (segment === "active") {
      return jobs.filter((j) => ACTIVE.includes(j.status));
    }
    if (segment === "completed") {
      return jobs.filter((j) => j.status === "completed");
    }
    return jobs.filter((j) => j.status === "cancelled");
  }, [jobs, segment]);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        await load();
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
      <p className="mt-1 text-sm text-slate-500">Active trips and history</p>

      <div className="mt-5 flex rounded-xl bg-gray-100 p-1">
        {(["active", "completed", "cancelled"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSegment(key)}
            className={`flex-1 rounded-lg py-2.5 text-xs capitalize transition active:scale-95 sm:text-sm ${
              segment === key
                ? "bg-white font-bold text-[#1A4D3A] shadow-sm"
                : "font-normal text-[#6B7280]"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {segment === "active" && active ? (
        <section className="mt-5 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
            Current job
          </p>
          <h2 className="mt-1 text-lg font-bold">
            {active.reference_code} · {STATUS_LABELS[active.status]}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {SERVICE_LABELS[active.service_type]} ·{" "}
            {formatMoney(Number(active.fee_amount))}
          </p>
          <p className="mt-2 text-sm">
            <strong>Pickup:</strong> {active.pickup_landmark}
          </p>
          <p className="text-sm">
            <strong>Dropoff:</strong> {active.dropoff_landmark}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(active.status === "assigned" ||
              active.status === "confirmed") && (
              <button
                type="button"
                disabled={pending}
                className="rounded-xl bg-[#1A4D3A] px-4 py-3 text-sm font-bold text-white transition active:scale-95"
                onClick={() => run(() => startTrip(active.id, driverId!))}
              >
                Start Trip
              </button>
            )}
            {active.status === "in_progress" && (
              <button
                type="button"
                disabled={pending}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition active:scale-95"
                onClick={() => run(() => completeTrip(active.id, driverId!))}
              >
                Complete Trip
              </button>
            )}
            <Link
              href={`/trip/${active.reference_code}`}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition active:scale-95"
            >
              Live map
            </Link>
          </div>
        </section>
      ) : null}

      {list.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-base font-semibold text-slate-900">
            {segment === "active" ? "No active jobs" : `No ${segment} jobs`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {segment === "active"
              ? "No active jobs. Wait for requests on the Home tab."
              : "Completed trips will show here after you finish them."}
          </p>
          {segment === "active" ? (
            <Link
              href="/driver/home"
              className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-6 py-3 text-sm font-bold text-white transition active:scale-95"
            >
              Open Home map
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map((job) => {
            const fee = Number(job.fee_amount) || 0;
            const commission =
              Number(job.platform_commission) > 0
                ? Math.round(Number(job.platform_commission))
                : Math.round((fee * 15) / 100);
            return (
              <li
                key={job.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {new Date(job.completed_at || job.created_at).toLocaleString(
                        "en-ZA",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {job.pickup_landmark} → {job.dropoff_landmark}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {SERVICE_LABELS[job.service_type]} · {job.reference_code}
                    </p>
                    {job.status === "completed" ? (
                      <p className="mt-1 text-xs text-amber-800">
                        Commission deducted: {formatMoney(commission)}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    {formatMoney(fee)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
