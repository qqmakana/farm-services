"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { listJobsByCustomerPhone, cancelRiderJobAction } from "@/lib/actions";
import {
  formatMoney,
  SERVICE_LABELS,
  serviceBadgeClass,
} from "@/lib/format";
import {
  getGuestProfile,
  setGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";
import type { JobStatus, JobWithDriver } from "@/lib/types";
import { TripReceipt } from "@/components/customer/trip-receipt";

type Segment = "upcoming" | "past";

const UPCOMING: JobStatus[] = [
  "new",
  "searching_driver",
  "assigned",
  "confirmed",
  "in_progress",
];

function activityStatusLabel(status: JobStatus): string {
  switch (status) {
    case "new":
    case "searching_driver":
      return "Pending";
    case "assigned":
    case "confirmed":
    case "in_progress":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function activityStatusClass(status: JobStatus): string {
  switch (status) {
    case "new":
    case "searching_driver":
      return "bg-[#eeeeee] text-black";
    case "assigned":
    case "confirmed":
    case "in_progress":
      return "bg-black text-white";
    case "completed":
      return "bg-[#f0f0f0] text-[#5a5a5a]";
    case "cancelled":
      return "bg-[#fdecea] text-[#b01000]";
    default:
      return "bg-[#f0f0f0] text-[#5a5a5a]";
  }
}

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
  if (sameDay) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYest =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYest) return `Yesterday, ${time}`;
  return d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityView() {
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [segment, setSegment] = useState<Segment>("upcoming");
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  const [receiptJob, setReceiptJob] = useState<JobWithDriver | null>(null);

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
    const next = { name: nameInput.trim(), phone };
    setGuestProfile(next);
    setProfile(getGuestProfile());
    loadTrips(phone);
  }

  const filtered = useMemo(() => {
    if (segment === "upcoming") {
      return jobs.filter((j) => UPCOMING.includes(j.status));
    }
    return jobs.filter(
      (j) => j.status === "completed" || j.status === "cancelled",
    );
  }, [jobs, segment]);

  if (!hydrated) {
    return (
      <main className="ru-page ru-force-light">
        <p className="text-sm text-[var(--ru-muted)]">Loading…</p>
      </main>
    );
  }

  if (!profile?.phone) {
    return (
      <main className="ru-page ru-page-enter ru-force-light">
        <h1 className="ru-page-title">Activity</h1>
        <p className="ru-page-sub">
          Enter your phone number to view your trips.
        </p>
        <form onSubmit={savePhone} className="ru-card mt-8 space-y-3 p-5">
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
            <span className="font-normal text-[var(--ru-muted)]">(optional)</span>
            <input
              className="ru-soft-field mt-1"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </label>
          {error ? (
            <p className="text-sm text-[var(--ru-error)]">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="ru-btn ru-btn-primary ru-btn-block"
          >
            {pending ? "Loading…" : "View my trips"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="ru-page ru-page-enter ru-force-light">
      <h1 className="ru-page-title">Activity</h1>
      <p className="ru-page-sub">Trips for {profile.phone}</p>

      <div className="ru-segment mt-5">
        {(["upcoming", "past"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSegment(key)}
            aria-selected={segment === key}
            className="capitalize"
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

      {pending && jobs.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">Loading trips…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <MapPin className="h-9 w-9 text-gray-400" aria-hidden />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">
            No {segment} trips
          </p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Book a ride, delivery, farm, or courier trip and it will show up here.
          </p>
          <Link href="/" className="ru-btn ru-btn-primary mt-6">
            Book your first trip
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((job) => (
            <li key={job.id} className="ru-card p-4">
              <Link
                href={`/trip/${job.reference_code}`}
                className="block transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">
                      {formatTripWhen(job.scheduled_for, job.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Driver: {job.drivers?.full_name || "—"}
                    </p>
                    <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-slate-900">
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#000000]"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        {job.pickup_landmark}
                        <span className="mx-1 font-normal text-slate-400">
                          →
                        </span>
                        {job.dropoff_landmark}
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${serviceBadgeClass(job.service_type)}`}
                      >
                        {SERVICE_LABELS[job.service_type]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${activityStatusClass(job.status)}`}
                      >
                        {activityStatusLabel(job.status)}
                      </span>
                      <span className="rounded-full bg-[#eeeeee] px-2 py-0.5 text-[11px] font-semibold text-black">
                        {job.payment_method === "card" ||
                        job.payment_method === "paypal"
                          ? "Card"
                          : "Cash"}
                      </span>
                    </div>
                  </div>
                  <p className="shrink-0 text-base font-bold text-slate-900">
                    {formatMoney(Number(job.fee_amount))}
                  </p>
                </div>
              </Link>
              {job.status === "completed" ? (
                <button
                  type="button"
                  onClick={() => setReceiptJob(job)}
                  className="ru-btn ru-btn-secondary ru-btn-block mt-3 !min-h-10 !text-xs"
                >
                  View receipt
                </button>
              ) : null}
              {profile &&
              ["new", "searching_driver", "assigned", "confirmed"].includes(
                job.status,
              ) ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
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
                          e instanceof Error ? e.message : "Could not cancel",
                        );
                      }
                    });
                  }}
                  className="ru-btn ru-btn-secondary ru-btn-block mt-3 !min-h-10 !text-xs"
                >
                  {job.village_pass
                    ? "Cancel free (Village Pass)"
                    : "Cancel trip"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {receiptJob ? (
        <TripReceipt job={receiptJob} onClose={() => setReceiptJob(null)} />
      ) : null}
    </main>
  );
}
