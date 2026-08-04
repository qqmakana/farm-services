"use client";

import type { ReactNode } from "react";

/**
 * Classic Uber "Where to?" — black circle (pickup) + black square (dropoff)
 * with a vertical connector. Floating white card over the map / in the sheet.
 */
export function WhereToBar({
  pickupSlot,
  dropoffSlot,
  className = "",
  floating = true,
}: {
  pickupSlot: ReactNode;
  dropoffSlot: ReactNode;
  className?: string;
  /** White floating card (default on for native look) */
  floating?: boolean;
}) {
  return (
    <div
      data-testid="search-bar"
      className={`${
        floating
          ? "rounded-2xl bg-white p-4 shadow-lg"
          : "rounded-2xl bg-white p-4 shadow-lg"
      } ${className}`}
    >
      <div className="flex gap-3">
        <div className="flex w-3 shrink-0 flex-col items-center pt-4 pb-4">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-black"
            aria-hidden
          />
          <span
            className="my-1 w-px flex-1 bg-gray-300"
            aria-hidden
          />
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-black"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="min-h-11 overflow-hidden rounded-lg bg-gray-100 p-3">
            {pickupSlot}
          </div>
          <div className="min-h-11 overflow-hidden rounded-lg bg-gray-100 p-3">
            {dropoffSlot}
          </div>
        </div>
      </div>
    </div>
  );
}
