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
      <h1 className="text-center text-[20px] font-bold leading-tight tracking-[-0.4px] text-[#000000]">
        Plan your ride
      </h1>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={onToggleWhen}
          data-testid="home-later"
          className="uber-press inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#EEEEEE] px-3.5 text-[14px] font-medium tracking-[-0.2px] text-[#000000]"
        >
          {whenMode === "later" ? (
            <CalendarClock className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          ) : (
            <Clock className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          )}
          <span className="truncate">{nowLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#000000]" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={onForMe}
          className="uber-press inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#EEEEEE] px-3.5 text-[14px] font-medium tracking-[-0.2px] text-[#000000]"
        >
          <User className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          <span className="truncate">{forMeLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#000000]" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
