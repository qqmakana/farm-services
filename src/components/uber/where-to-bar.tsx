"use client";

import type { ReactNode } from "react";
import { ArrowUpDown } from "lucide-react";

/**
 * Uber "Where to?" — hollow pickup circle + solid dropoff square
 * inside a thin black-bordered card.
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
  void floating;
  return (
    <div
      data-testid="search-bar"
      className={`rounded-xl border border-[#0a0a0a] bg-white p-3 ${className}`}
    >
      <div className="flex gap-3">
        <div className="flex w-3 shrink-0 flex-col items-center pt-3.5 pb-3.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border-[2.5px] border-[#0a0a0a] bg-white"
            aria-hidden
          />
          <span className="my-1 w-px flex-1 bg-[#d0d0d0]" aria-hidden />
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[#0a0a0a]"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1 divide-y divide-[#e8e8e8]">
          <div className="min-h-11 py-2.5 pr-1">{pickupSlot}</div>
          <div className="min-h-11 py-2.5 pr-1">{dropoffSlot}</div>
        </div>
        {onSwap ? (
          <button
            type="button"
            onClick={onSwap}
            className="uber-press mt-7 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eeeeee] text-[#0a0a0a]"
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
