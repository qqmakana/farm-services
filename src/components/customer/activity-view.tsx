"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Calendar, MapPin, SlidersHorizontal } from "lucide-react";
import { listJobsByCustomerPhone, cancelRiderJobAction } from "@/lib/actions";
import { formatMoney, SERVICE_LABELS } from "@/lib/format";
import {
  getGuestProfile,
  setGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";
import type { JobStatus, JobWithDriver } from "@/lib/types";
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
      <main className="min-h-dvh bg-white px-4 pb-28 pt-6">
        <h1 className="text-3xl font-bold tracking-tight text-black">
          Activity
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Enter your phone number to view your trips.
        </p>
        <form
          onSubmit={savePhone}
          className="mt-8 space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <label className="block text-sm font-semibold text-black">
            Phone number
            <input
              className="ru-soft-field mt-1"
              placeholder="063 621 3590"
              inputMode="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-black">
            Name{" "}
            <span className="font-normal text-gray-500">(optional)</span>
            <input
              className="ru-soft-field mt-1"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="ru-btn-book ru-btn-block"
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

      {/* Upcoming */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-black">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Calendar className="h-6 w-6 text-gray-500" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-black">
                  You have no upcoming trips
                </p>
                <Link
                  href="/ride?when=later"
                  className="mt-2 inline-block text-sm font-semibold text-black underline underline-offset-2"
                >
                  Reserve your trip →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <ul className="mt-3 space-y-4">
            {upcoming.map((job) => (
              <TripCard
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

      {/* Past */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-black">Past</h2>
          <button
            type="button"
            onClick={() => setShowPastOnly((v) => !v)}
            className={`uber-press flex h-11 w-11 cursor-pointer items-center justify-center rounded-full ${
              showPastOnly
                ? "bg-black text-white hover:bg-gray-800"
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
          <ul className="mt-3 space-y-4">
            {pastVisible.map((job) => (
              <TripCard
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

function TripCard({
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
    <li className="uber-press overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md">
      <Link href={`/trip/${job.reference_code}`} className="block touch-manipulation">
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-200 via-gray-100 to-emerald-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-10 w-10 text-gray-400" aria-hidden />
          </div>
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-black backdrop-blur">
            {SERVICE_LABELS[job.service_type]}
          </span>
        </div>
        <div className="p-4">
          <p className="text-lg font-semibold tracking-tight text-black">
            {job.dropoff_landmark || job.pickup_landmark}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {formatTripWhen(job.scheduled_for, job.created_at)}
          </p>
          <p className="mt-2 text-base font-medium text-black">
            {formatMoney(Number(job.fee_amount))}
          </p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-3">
        {showRebook ? (
          <Link
            href={rebookHref(job)}
            className="uber-press min-h-11 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200"
          >
            Rebook
          </Link>
        ) : null}
        {onReceipt ? (
          <button
            type="button"
            onClick={onReceipt}
            className="uber-press min-h-11 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200"
          >
            Receipt
          </button>
        ) : null}
        {onCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="uber-press min-h-11 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </li>
  );
}
