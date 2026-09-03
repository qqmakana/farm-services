"use client";

import type { ReactNode } from "react";
import { ArrowUpDown, Plus } from "lucide-react";

/**
 * Uber "Where to?" — hollow pickup circle + solid dropoff square.
 * Plan-your-ride uses no outer border (Uber list screen); ride sheet can keep one.
 */
export function WhereToBar({
  pickupSlot,
  dropoffSlot,
  onSwap,
  onAddStop,
  className = "",
  floating = true,
  bordered = true,
}: {
  pickupSlot: ReactNode;
  dropoffSlot: ReactNode;
  onSwap?: () => void;
  onAddStop?: () => void;
  className?: string;
  /** White floating card (default on for native look) */
  floating?: boolean;
  /** Thin black outline — off for Plan your ride. */
  bordered?: boolean;
}) {
  void floating;
  return (
    <div className={`flex items-stretch gap-2 ${className}`}>
      <div
        data-testid="search-bar"
        className={`min-w-0 flex-1 rounded-xl bg-white p-3 ${
          bordered ? "border border-[#0a0a0a]" : ""
        }`}
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
      {onAddStop ? (
        <button
          type="button"
          onClick={onAddStop}
          aria-label="Add stop"
          data-testid="add-stop"
          className="uber-press mt-1 flex h-12 w-12 shrink-0 self-center items-center justify-center rounded-full bg-[#eeeeee] text-[#0a0a0a]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
