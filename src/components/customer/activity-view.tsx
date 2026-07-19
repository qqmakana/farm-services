"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { listJobsByCustomerPhone } from "@/lib/actions";
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
      return "bg-amber-100 text-amber-900";
    case "assigned":
    case "confirmed":
    case "in_progress":
      return "bg-emerald-100 text-emerald-900";
    case "completed":
      return "bg-gray-100 text-gray-700";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-gray-100 text-gray-700";
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
      <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  if (!profile?.phone) {
    return (
      <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
        <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your phone number to view your trips.
        </p>
        <form
          onSubmit={savePhone}
          className="mt-8 space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 text-base outline-none focus:border-[#1A4D3A]"
              placeholder="063 621 3590"
              inputMode="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Name <span className="font-normal text-slate-400">(optional)</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 text-base outline-none focus:border-[#1A4D3A]"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </label>
          {error ? (
            <p className="text-sm text-rose-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#1A4D3A] py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {pending ? "Loading…" : "View my trips"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
      <p className="mt-1 text-sm text-slate-500">Trips for {profile.phone}</p>

      <div className="mt-5 flex rounded-xl bg-gray-100 p-1">
        {(["upcoming", "past"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSegment(key)}
            className={`flex-1 rounded-lg py-2.5 text-sm capitalize transition active:scale-95 ${
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
            Book a ride, delivery, or farm trip and it will show up here.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-xl bg-[#1A4D3A] px-6 py-3 text-sm font-bold text-white transition active:scale-95"
          >
            Book your first trip
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((job) => (
            <li key={job.id}>
              <Link
                href={`/trip/${job.reference_code}`}
                className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition active:scale-95"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">
                      {formatTripWhen(job.scheduled_for, job.created_at)}
                    </p>
                    <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-slate-900">
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1A4D3A]"
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
                    </div>
                  </div>
                  <p className="shrink-0 text-base font-bold text-slate-900">
                    {formatMoney(Number(job.fee_amount))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
