"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  completeTrip,
  listDriverActiveJob,
  listDriverJobs,
  rateCustomerByDriver,
  rateShopByDriver,
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
  const [rateStars, setRateStars] = useState(5);
  const [rateComment, setRateComment] = useState("");
  const [ratingJobId, setRatingJobId] = useState<string | null>(null);

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
    <main className="ru-page-enter mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-black">
        Jobs
      </h1>
      <p className="mt-1 text-sm text-[var(--ru-muted)]">Active trips and history</p>

      <div className="mt-5 flex gap-4 border-b border-[var(--ru-line)]">
        {(["active", "completed", "cancelled"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSegment(key)}
            className={`-mb-px border-b-2 pb-2 text-sm font-semibold capitalize transition ${
              segment === key
                ? "border-black text-black"
                : "border-transparent text-[var(--ru-muted)]"
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
        <section className="ru-card mt-5 p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
            Current job
          </p>
          <h2 className="mt-1 text-lg font-bold text-black">
            {active.reference_code} · {STATUS_LABELS[active.status]}
          </h2>
          <p className="mt-2 text-sm text-[var(--ru-muted)]">
            {SERVICE_LABELS[active.service_type]} ·{" "}
            {formatMoney(Number(active.fee_amount))}
          </p>
          <p className="mt-2 text-sm text-black">
            {active.pickup_landmark}
            <span className="mx-1 text-[var(--ru-muted)]">→</span>
            {active.dropoff_landmark}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {(active.status === "assigned" ||
              active.status === "confirmed") && (
              <button
                type="button"
                disabled={pending}
                className="ru-btn ru-btn-brand ru-btn-block"
                onClick={() => run(() => startTrip(active.id, driverId!))}
              >
                START TRIP
              </button>
            )}
            {active.status === "in_progress" && (
              <button
                type="button"
                disabled={pending}
                className="ru-btn ru-btn-primary ru-btn-block"
                onClick={() => run(() => completeTrip(active.id, driverId!))}
              >
                COMPLETE TRIP
              </button>
            )}
            <Link
              href={`/trip/${active.reference_code}`}
              className="ru-btn ru-btn-secondary ru-btn-block text-center"
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
                    {job.status === "completed" &&
                    !job.customer_rating_stars ? (
                      <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-[#2a2a2a]">
                        <p className="text-xs font-semibold text-slate-700 dark:text-white">
                          Rate this customer
                        </p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                setRatingJobId(job.id);
                                setRateStars(n);
                              }}
                              className={`h-8 w-8 rounded-full text-xs font-bold ${
                                (ratingJobId === job.id ? rateStars : 5) >= n
                                  ? "bg-amber-400 text-white"
                                  : "bg-white text-slate-500"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white"
                          onClick={() =>
                            run(async () => {
                              await rateCustomerByDriver(
                                job.id,
                                driverId!,
                                ratingJobId === job.id ? rateStars : 5,
                                rateComment || undefined,
                              );
                              setRateComment("");
                              setRatingJobId(null);
                            })
                          }
                        >
                          Submit customer rating
                        </button>
                      </div>
                    ) : null}
                    {job.customer_rating_stars ? (
                      <p className="mt-1 text-xs text-slate-500">
                        You rated customer ★{job.customer_rating_stars}
                      </p>
                    ) : null}
                    {job.status === "completed" && job.shop_id ? (
                      <button
                        type="button"
                        disabled={pending}
                        className="mt-2 text-xs font-semibold text-black underline dark:text-white"
                        onClick={() => {
                          const raw = window.prompt(
                            "Rate this merchant 1–5 stars",
                            "5",
                          );
                          if (!raw) return;
                          const stars = Math.min(
                            5,
                            Math.max(1, Number(raw) || 5),
                          );
                          run(async () => {
                            await rateShopByDriver(job.id, driverId!, stars);
                          });
                        }}
                      >
                        Rate merchant
                      </button>
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
