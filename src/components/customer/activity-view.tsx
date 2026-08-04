"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Calendar, ChevronRight, SlidersHorizontal } from "lucide-react";
import { listJobsByCustomerPhone, cancelRiderJobAction } from "@/lib/actions";
import { formatMoney, SERVICE_LABELS } from "@/lib/format";
import {
  getGuestProfile,
  setGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";
import type { JobStatus, JobWithDriver, ServiceType } from "@/lib/types";
import { TripReceipt } from "@/components/customer/trip-receipt";

const UPCOMING: JobStatus[] = [
  "new",
  "searching_driver",
  "assigned",
  "confirmed",
  "in_progress",
];

function formatTripWhen(iso: string | null, createdAt: string): string {
  const d = new Date(iso || createdAt);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Today · ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYest =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYest) return `Yesterday · ${time}`;
  return d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function rebookHref(job: JobWithDriver): string {
  const base =
    job.service_type === "delivery"
      ? "/delivery"
      : job.service_type === "courier"
        ? "/courier"
        : job.service_type === "farm"
          ? "/farm"
          : "/ride";
  const params = new URLSearchParams();
  if (job.pickup_landmark) params.set("from", job.pickup_landmark);
  if (job.pickup_lat != null) params.set("fromLat", String(job.pickup_lat));
  if (job.pickup_lng != null) params.set("fromLng", String(job.pickup_lng));
  if (job.dropoff_landmark) params.set("to", job.dropoff_landmark);
  if (job.dropoff_lat != null) params.set("toLat", String(job.dropoff_lat));
  if (job.dropoff_lng != null) params.set("toLng", String(job.dropoff_lng));
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

function thumbFor(service: ServiceType) {
  if (service === "delivery" || service === "courier") return "/home/sug-courier.jpg";
  if (service === "farm") return "/home/sug-farm.jpg";
  return "/home/sug-ride.jpg";
}

export function ActivityView() {
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  const [receiptJob, setReceiptJob] = useState<JobWithDriver | null>(null);
  const [showPastOnly, setShowPastOnly] = useState(false);

  const loadTrips = useCallback((phone: string) => {
    startTransition(async () => {
      setError(null);
      try {
        const rows = await listJobsByCustomerPhone(phone);
        setJobs(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load trips");
        setJobs([]);
      }
    });
  }, []);

  useEffect(() => {
    const p = getGuestProfile();
    setProfile(p);
    setHydrated(true);
    if (p?.phone) loadTrips(p.phone);
  }, [loadTrips]);

  function savePhone(e: React.FormEvent) {
    e.preventDefault();
    const phone = phoneInput.trim();
    if (!phone) {
      setError("Enter your phone number");
      return;
    }
    setGuestProfile({ name: nameInput.trim(), phone });
    setProfile(getGuestProfile());
    loadTrips(phone);
  }

  const upcoming = useMemo(
    () => jobs.filter((j) => UPCOMING.includes(j.status)),
    [jobs],
  );
  const past = useMemo(
    () =>
      jobs.filter(
        (j) => j.status === "completed" || j.status === "cancelled",
      ),
    [jobs],
  );

  if (!hydrated) {
    return (
      <main className="min-h-dvh bg-white px-4 pb-28 pt-6">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  if (!profile?.phone) {
    return (
      <main className="min-h-dvh touch-manipulation bg-white px-4 pb-28 pt-6">
        <h1 className="text-3xl font-bold tracking-tight text-black">
          Activity
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Enter your phone number to view your trips.
        </p>
        <form onSubmit={savePhone} className="mt-8 space-y-3">
          <input
            className="ru-soft-field"
            placeholder="Phone number"
            inputMode="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
          />
          <input
            className="ru-soft-field"
            placeholder="Name (optional)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="uber-press uber-btn-black w-full"
          >
            {pending ? "Loading…" : "View my trips"}
          </button>
        </form>
      </main>
    );
  }

  const pastVisible = showPastOnly
    ? past.filter((j) => j.status === "completed")
    : past;

  return (
    <main
      data-testid="activity-view"
      className="min-h-dvh touch-manipulation bg-white px-4 pb-28 pt-6"
    >
      <h1 className="text-3xl font-bold tracking-tight text-black">Activity</h1>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-black">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="mt-3 flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white">
              <Calendar className="h-6 w-6 text-gray-500" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-black">No upcoming trips</p>
              <Link
                href="/ride?when=later"
                className="uber-press mt-1 inline-block text-sm font-semibold text-black underline underline-offset-2"
              >
                Reserve a trip
              </Link>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" aria-hidden />
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {upcoming.map((job) => (
              <TripRow
                key={job.id}
                job={job}
                pending={pending}
                onCancel={
                  profile &&
                  ["new", "searching_driver", "assigned", "confirmed"].includes(
                    job.status,
                  )
                    ? () => {
                        startTransition(async () => {
                          try {
                            await cancelRiderJobAction({
                              jobId: job.id,
                              customerPhone: profile.phone,
                            });
                            setJobs((prev) =>
                              prev.map((j) =>
                                j.id === job.id
                                  ? { ...j, status: "cancelled" }
                                  : j,
                              ),
                            );
                          } catch (e) {
                            setError(
                              e instanceof Error
                                ? e.message
                                : "Could not cancel",
                            );
                          }
                        });
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-black">Past</h2>
          <button
            type="button"
            onClick={() => setShowPastOnly((v) => !v)}
            className={`uber-press flex h-10 w-10 items-center justify-center rounded-full ${
              showPastOnly
                ? "bg-black text-white"
                : "bg-gray-100 text-black hover:bg-gray-200"
            }`}
            aria-label="Filter completed trips"
            aria-pressed={showPastOnly}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        {pending && jobs.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-500">
            Loading trips…
          </p>
        ) : pastVisible.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            No past trips yet. Book a ride and it will show up here.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {pastVisible.map((job) => (
              <TripRow
                key={job.id}
                job={job}
                pending={pending}
                onReceipt={
                  job.status === "completed"
                    ? () => setReceiptJob(job)
                    : undefined
                }
                showRebook
              />
            ))}
          </ul>
        )}
      </section>

      {receiptJob ? (
        <TripReceipt job={receiptJob} onClose={() => setReceiptJob(null)} />
      ) : null}
    </main>
  );
}

function TripRow({
  job,
  pending,
  onCancel,
  onReceipt,
  showRebook,
}: {
  job: JobWithDriver;
  pending: boolean;
  onCancel?: () => void;
  onReceipt?: () => void;
  showRebook?: boolean;
}) {
  return (
    <li className="py-3">
      <Link
        href={`/trip/${job.reference_code}`}
        className="uber-press flex items-center gap-3 rounded-2xl p-1 hover:bg-gray-50 active:bg-gray-100"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={thumbFor(job.service_type)}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-black">
            {job.dropoff_landmark || job.pickup_landmark}
          </span>
          <span className="mt-0.5 block text-sm text-gray-500">
            {SERVICE_LABELS[job.service_type]} ·{" "}
            {formatTripWhen(job.scheduled_for, job.created_at)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold text-black">
            {formatMoney(Number(job.fee_amount))}
          </span>
          <ChevronRight className="ml-auto mt-1 h-4 w-4 text-gray-400" />
        </span>
      </Link>
      {(showRebook || onReceipt || onCancel) && (
        <div className="mt-2 flex flex-wrap gap-2 pl-[4.25rem]">
          {showRebook ? (
            <Link
              href={rebookHref(job)}
              className="uber-press rounded-full bg-gray-100 px-3.5 py-2 text-xs font-bold text-black hover:bg-gray-200"
            >
              Rebook
            </Link>
          ) : null}
          {onReceipt ? (
            <button
              type="button"
              onClick={onReceipt}
              className="uber-press rounded-full bg-gray-100 px-3.5 py-2 text-xs font-bold text-black hover:bg-gray-200"
            >
              Receipt
            </button>
          ) : null}
          {onCancel ? (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="uber-press rounded-full bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </li>
  );
}
