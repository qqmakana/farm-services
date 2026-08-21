"use client";

import { CalendarClock, ChevronDown, Clock, User } from "lucide-react";

/** Uber destination-screen header: title + Now / For me pills. */
export function PlanYourRideHeader({
  whenMode,
  whenLabel,
  forMeLabel = "For me",
  onToggleWhen,
  onForMe,
}: {
  whenMode: "now" | "later";
  whenLabel?: string;
  forMeLabel?: string;
  onToggleWhen?: () => void;
  onForMe?: () => void;
}) {
  const nowLabel =
    whenMode === "later" ? whenLabel || "Later" : "Pickup now";

  return (
    <div className="space-y-3">
      <h1 className="text-center text-[22px] font-bold tracking-[-0.04em] text-[#0a0a0a]">
        Plan your ride
      </h1>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleWhen}
          className="uber-press flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#eeeeee] px-3 text-[14px] font-semibold text-[#0a0a0a]"
        >
          {whenMode === "later" ? (
            <CalendarClock className="h-4 w-4 shrink-0" strokeWidth={2} />
          ) : (
            <Clock className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          <span className="truncate">{nowLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#6b6b6b]" />
        </button>
        <button
          type="button"
          onClick={onForMe}
          className="uber-press flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#eeeeee] px-3 text-[14px] font-semibold text-[#0a0a0a]"
        >
          <User className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">{forMeLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#6b6b6b]" />
        </button>
      </div>
    </div>
  );
}
