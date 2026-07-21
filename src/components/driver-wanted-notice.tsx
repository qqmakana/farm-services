"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSelectedDriverId } from "@/lib/driver-session";
import {
  hasSeenDriverWantedNotice,
  markDriverWantedNoticeSeen,
} from "@/lib/driver-recruit";

/**
 * One-time in-app notice after first open (not FCM).
 * Bottom sheet — tap goes to /driver/join.
 */
export function DriverWantedNotice() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (getSelectedDriverId()) return;
    if (hasSeenDriverWantedNotice()) return;
    if (
      pathname?.startsWith("/onboarding") ||
      pathname?.startsWith("/driver") ||
      pathname?.startsWith("/admin")
    ) {
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [pathname]);

  function close() {
    markDriverWantedNoticeSeen();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="driver-wanted-notice-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Dismiss"
        onClick={close}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              id="driver-wanted-notice-title"
              className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900"
            >
              Drivers wanted in your village
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Earn 85% on rides, deliveries &amp; farm jobs — apply once for all
              three Village Ride services.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[var(--ru-muted)] hover:bg-[#f0f0f0]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/driver/join"
            onClick={close}
            className="ru-btn ru-btn-primary ru-btn-block !rounded-full"
          >
            Apply to drive
          </Link>
          <button
            type="button"
            onClick={close}
            className="ru-btn ru-btn-ghost ru-btn-block !min-h-11 text-sm"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
