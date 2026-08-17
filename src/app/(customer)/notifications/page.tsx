"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  MapPin,
  Wallet,
  XCircle,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { listJobsByCustomerPhone } from "@/lib/actions";
import { getGuestProfile } from "@/lib/guest-profile";
import { SERVICE_LABELS } from "@/lib/format";
import type { JobWithDriver } from "@/lib/types";

type Note = {
  id: string;
  href?: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  Icon: typeof Bell;
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (!Number.isFinite(mins) || mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function notesFromJobs(jobs: JobWithDriver[]): Note[] {
  return jobs.slice(0, 20).map((job) => {
    const service = SERVICE_LABELS[job.service_type] ?? "Trip";
    const href = `/trip/${job.reference_code}`;
    const time = relativeTime(job.updated_at || job.created_at);
    if (job.status === "searching_driver" || job.status === "new") {
      return {
        id: job.id,
        href,
        title: "Finding your driver",
        body: `${service} ${job.reference_code} — ${job.pickup_landmark} to ${job.dropoff_landmark}.`,
        time,
        unread: true,
        Icon: Bell,
      };
    }
    if (job.status === "confirmed" || job.status === "assigned") {
      return {
        id: job.id,
        href,
        title: "Driver on the way",
        body: job.drivers?.full_name
          ? `${job.drivers.full_name} is heading to ${job.pickup_landmark}.`
          : `Your ${service} is confirmed. Track live on the trip screen.`,
        time,
        unread: true,
        Icon: MapPin,
      };
    }
    if (job.status === "in_progress") {
      return {
        id: job.id,
        href,
        title: "Trip in progress",
        body: `On the way to ${job.dropoff_landmark}.`,
        time,
        unread: true,
        Icon: MapPin,
      };
    }
    if (job.status === "completed") {
      return {
        id: job.id,
        href,
        title: "Trip completed",
        body:
          job.payment_method === "card"
            ? "Thanks for riding. Card payment is settled."
            : "Thanks for riding. Pay your driver in cash if you haven’t yet.",
        time,
        unread: false,
        Icon: CheckCheck,
      };
    }
    if (job.status === "cancelled") {
      return {
        id: job.id,
        href,
        title: "Trip cancelled",
        body: `${service} ${job.reference_code} was cancelled.`,
        time,
        unread: false,
        Icon: XCircle,
      };
    }
    return {
      id: job.id,
      href,
      title: service,
      body: job.reference_code,
      time,
      unread: false,
      Icon: Bell,
    };
  });
}

export default function NotificationsPage() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [hasPhone, setHasPhone] = useState(true);

  const load = useCallback(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) {
      setHasPhone(false);
      setNotes([]);
      return;
    }
    setHasPhone(true);
    void listJobsByCustomerPhone(guest.phone)
      .then((jobs) => setNotes(notesFromJobs(jobs)))
      .catch(() => setNotes([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const empty = notes != null && notes.length === 0;

  return (
    <PageShell
      title="Notifications"
      subtitle="Trip updates from this phone"
    >
      {notes == null ? (
        <p className="text-sm text-[var(--ru-muted)]">Loading…</p>
      ) : empty ? (
        <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-gray-400" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-black">
            {hasPhone ? "No trip updates yet" : "Add your phone to see trips"}
          </p>
          <p className="mt-1 text-xs text-[var(--ru-muted)]">
            {hasPhone
              ? "Book a ride and status updates will show up here."
              : "Save your name and phone in Account so we can match your trips."}
          </p>
          <Link
            href={hasPhone ? "/ride" : "/account"}
            className="uber-press uber-btn-black mt-4 inline-flex !min-h-11 !px-4 !text-sm"
          >
            {hasPhone ? "Book a ride" : "Open account"}
          </Link>
        </div>
      ) : (
        <div className="ru-list">
          {notes.map((n) => {
            const Icon = n.Icon;
            const inner = (
              <>
                <span className="ru-icon-circle !h-10 !w-10">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`truncate text-sm ${
                        n.unread
                          ? "font-bold text-black"
                          : "font-semibold text-black"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.unread ? <Badge tone="accent">New</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--ru-muted)]">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ru-muted)]">
                    {n.time}
                  </p>
                </div>
              </>
            );
            return n.href ? (
              <Link
                key={n.id}
                href={n.href}
                className={`ru-row ${n.unread ? "bg-white" : "bg-[var(--ru-canvas)]"}`}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={n.id}
                className={`ru-row ${n.unread ? "bg-white" : "bg-[var(--ru-canvas)]"}`}
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 text-center text-xs text-[var(--ru-muted)]">
        <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Push alerts need the installed app.{" "}
          <Link href="/get-app" className="font-semibold text-black underline">
            Install Village Ride
          </Link>
        </span>
      </p>
    </PageShell>
  );
}
