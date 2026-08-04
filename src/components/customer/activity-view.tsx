"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Calendar, ChevronRight } from "lucide-react";
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
  if (sameDay) return `Today at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYest =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYest) return `Yesterday at ${time}`;
  return d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
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

type Tab = "upcoming" | "past";

export function ActivityView() {
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  const [receiptJob, setReceiptJob] = useState<JobWithDriver | null>(null);
  const [tab, setTab] = useState<Tab>("past");

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

  useEffect(() => {
    if (upcoming.length > 0) setTab("upcoming");
  }, [upcoming.length]);

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
          Enter your phone to see trips.
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
            {pending ? "Loading…" : "View activity"}
          </button>
        </form>
      </main>
    );
  }

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <main
      data-testid="activity-view"
      className="min-h-dvh touch-manipulation bg-white px-4 pb-28 pt-6"
    >
      <h1 className="text-3xl font-bold tracking-tight text-black">Activity</h1>

      {/* Uber-style Upcoming / Past chips */}
      <div
        className="mt-5 flex gap-2"
        role="tablist"
        aria-label="Activity filters"
      >
        {(
          [
            { id: "upcoming" as const, label: "Upcoming" },
            { id: "past" as const, label: "Past" },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`uber-press rounded-full px-4 py-2 text-sm font-semibold ${
                active
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
              {t.id === "upcoming" && upcoming.length > 0
                ? ` · ${upcoming.length}`
                : ""}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {pending && jobs.length === 0 ? (
        <p className="mt-10 text-center text-sm text-gray-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white">
            <Calendar className="h-6 w-6 text-gray-400" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-black">
              {tab === "upcoming"
                ? "You have no upcoming trips"
                : "No past trips yet"}
            </p>
            <Link
              href={tab === "upcoming" ? "/ride?when=later" : "/ride"}
              className="uber-press mt-1 inline-block text-sm font-semibold text-black underline underline-offset-2"
            >
              {tab === "upcoming" ? "Reserve a trip" : "Book a ride"}
            </Link>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" aria-hidden />
        </div>
      ) : (
        <ul className="mt-4">
          {list.map((job) => (
            <TripRow
              key={job.id}
              job={job}
              pending={pending}
              showRebook={tab === "past" && job.status === "completed"}
              onReceipt={
                tab === "past" && job.status === "completed"
                  ? () => setReceiptJob(job)
                  : undefined
              }
              onCancel={
                tab === "upcoming" &&
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
    <li className="border-b border-gray-100 py-3 last:border-b-0">
      <Link
        href={`/trip/${job.reference_code}`}
        className="uber-press flex items-center gap-3 active:opacity-80"
      >
        <span className="relative h-12 w-[4.25rem] shrink-0 overflow-hidden">
          <Image
            src={thumbFor(job.service_type)}
            alt=""
            fill
            className="object-contain object-left"
            sizes="68px"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-black">
            {job.dropoff_landmark || job.pickup_landmark}
          </span>
          <span className="mt-0.5 block text-sm text-gray-500">
            {formatTripWhen(job.scheduled_for, job.created_at)}
          </span>
          <span className="mt-0.5 block text-xs text-gray-400">
            {SERVICE_LABELS[job.service_type]}
            {job.status === "completed"
              ? " · Completed"
              : job.status === "cancelled"
                ? " · Cancelled"
                : ""}
          </span>
        </span>
        <span
          data-testid="trip-fare"
          className="shrink-0 self-start pt-0.5 text-sm font-bold text-black"
        >
          {formatMoney(Number(job.fee_amount), job.fee_currency || "ZAR")}
        </span>
      </Link>
      {(showRebook || onReceipt || onCancel) && (
        <div className="mt-2.5 flex flex-wrap gap-2 pl-[5rem]">
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
              className="uber-press rounded-full bg-gray-100 px-3.5 py-2 text-xs font-bold text-black hover:bg-gray-200"
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </li>
  );
}
