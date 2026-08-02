"use client";

import Link from "next/link";
import { Bell, CheckCheck, MapPin, Wallet } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";

type Note = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  Icon: typeof Bell;
};

const SAMPLE: Note[] = [
  {
    id: "1",
    title: "Driver on the way",
    body: "Your Village Ride is confirmed. Track live on the trip screen.",
    time: "Just now",
    unread: true,
    Icon: MapPin,
  },
  {
    id: "2",
    title: "Trip completed",
    body: "Thanks for riding. Pay your driver in cash if you haven’t yet.",
    time: "Yesterday",
    unread: false,
    Icon: CheckCheck,
  },
  {
    id: "3",
    title: "Referral ready",
    body: "Share Village Ride — friends get a welcome ride credit when ops approves.",
    time: "This week",
    unread: false,
    Icon: Wallet,
  },
];

export default function NotificationsPage() {
  return (
    <PageShell
      title="Notifications"
      subtitle="Trip updates and account messages"
      actions={
        <button type="button" className="ru-btn ru-btn-ghost !min-h-10 !text-xs">
          Mark all read
        </button>
      }
    >
      <div className="ru-list">
        {SAMPLE.map((n) => {
          const Icon = n.Icon;
          return (
            <div
              key={n.id}
              className={`ru-row ${n.unread ? "bg-white" : "bg-[var(--ru-canvas)]"}`}
            >
              <span className="ru-icon-circle !h-10 !w-10">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate text-sm ${
                      n.unread ? "font-bold text-black" : "font-semibold text-black"
                    }`}
                  >
                    {n.title}
                  </p>
                  {n.unread ? <Badge tone="accent">New</Badge> : null}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--ru-muted)]">
                  {n.body}
                </p>
                <p className="mt-1 text-[11px] text-[var(--ru-muted)]">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-[var(--ru-muted)]">
        Push alerts need the installed app.{" "}
        <Link href="/get-app" className="font-semibold text-black underline">
          Install Village Ride
        </Link>
      </p>
    </PageShell>
  );
}
