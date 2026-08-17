"use client";

import type { ReactNode } from "react";
import { ArrowUpDown } from "lucide-react";

/**
 * Classic Uber "Where to?" — black circle (pickup) + black square (dropoff)
 * with a vertical connector. Floating white card over the map / in the sheet.
 */
export function WhereToBar({
  pickupSlot,
  dropoffSlot,
  onSwap,
  className = "",
  floating = true,
}: {
  pickupSlot: ReactNode;
  dropoffSlot: ReactNode;
  onSwap?: () => void;
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
        {onSwap ? (
          <button
            type="button"
            onClick={onSwap}
            className="uber-press mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-black hover:bg-gray-200"
            aria-label="Swap pickup and dropoff"
            data-testid="swap-locations"
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
