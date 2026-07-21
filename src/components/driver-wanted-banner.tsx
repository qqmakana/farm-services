"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSelectedDriverId } from "@/lib/driver-session";
import {
  dismissDriverWantedBanner,
  isDriverWantedBannerVisible,
} from "@/lib/driver-recruit";

/** Homepage strip — drivers wanted (hidden for logged-in drivers). */
export function DriverWantedBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getSelectedDriverId()) {
      setVisible(false);
      return;
    }
    setVisible(isDriverWantedBannerVisible());
  }, []);

  if (!visible) return null;

  return (
    <div className="ru-card relative overflow-hidden border border-[var(--ru-line)] bg-white p-4 shadow-[var(--ru-shadow)]">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[var(--ru-brand)]"
        aria-hidden
      />
      <div className="flex items-start gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-tight text-black">
            Drivers wanted — earn 85% of every trip
          </p>
          <p className="mt-0.5 text-xs text-[var(--ru-muted)]">
            Flexible hours. Keep most of what you earn. Apply free.
          </p>
          <Link
            href="/driver/join"
            className="ru-btn ru-btn-brand mt-3 !min-h-10 !px-4 !text-sm"
          >
            Apply now
          </Link>
        </div>
        <button
          type="button"
          aria-label="Dismiss drivers wanted banner"
          onClick={() => {
            dismissDriverWantedBanner();
            setVisible(false);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-[var(--ru-muted)] hover:bg-[#f0f0f0] hover:text-black"
        >
          ×
        </button>
      </div>
    </div>
  );
}
