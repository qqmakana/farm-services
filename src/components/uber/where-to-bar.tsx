"use client";

import type { ReactNode } from "react";

/**
 * Classic Uber "Where to?" — black circle (pickup) + black square (dropoff)
 * with a vertical connector. Use floating over the map or inside the sheet.
 */
export function WhereToBar({
  pickupSlot,
  dropoffSlot,
  className = "",
  floating = false,
}: {
  pickupSlot: ReactNode;
  dropoffSlot: ReactNode;
  className?: string;
  /** White floating card over the map */
  floating?: boolean;
}) {
  return (
    <div
      data-testid="search-bar"
      className={`${
        floating
          ? "rounded-2xl bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
          : "rounded-2xl border border-[var(--ru-line)] bg-white p-3"
      } ${className}`}
    >
      <div className="flex gap-3">
        <div className="flex w-3 shrink-0 flex-col items-center pt-3.5 pb-3.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-[var(--ru-ink)]"
            aria-hidden
          />
          <span
            className="my-1 w-px flex-1 bg-gray-300"
            aria-hidden
          />
          <span
            className="h-2 w-2 shrink-0 bg-[var(--ru-ink)]"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="min-h-11">{pickupSlot}</div>
          <div className="border-t border-gray-100" />
          <div className="min-h-11">{dropoffSlot}</div>
        </div>
      </div>
    </div>
  );
}
