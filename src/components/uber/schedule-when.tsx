"use client";

import {
  reserveMaxMs,
  reserveMinMs,
} from "@/lib/reserve-window";

export type WhenMode = "now" | "later";

/** Ride Now vs Schedule for Later — Home-style black / gray-100 pills. */
export function ScheduleWhen({
  mode,
  onModeChange,
  scheduledLocal,
  onScheduledLocalChange,
  nowLabel = "Ride Now",
  laterHint,
  minLocal,
  maxLocal,
}: {
  mode: WhenMode;
  onModeChange: (mode: WhenMode) => void;
  scheduledLocal: string;
  onScheduledLocalChange: (value: string) => void;
  nowLabel?: string;
  laterHint?: string;
  minLocal?: string;
  maxLocal?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-black">When</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange("now")}
          className={`uber-press min-h-12 rounded-full px-3 text-sm font-bold ${
            mode === "now"
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {nowLabel}
        </button>
        <button
          type="button"
          onClick={() => onModeChange("later")}
          className={`uber-press min-h-12 rounded-full px-3 text-sm font-bold ${
            mode === "later"
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Schedule for Later
        </button>
      </div>
      <p className="text-xs text-gray-500">
        {laterHint ??
          "Taxis not running? Book a verified ride or delivery in advance."}
      </p>
      {mode === "later" ? (
        <label className="block text-sm font-semibold text-black">
          Date &amp; time
          <input
            type="datetime-local"
            required
            className="ru-soft-field mt-1.5 text-sm"
            value={scheduledLocal}
            onChange={(e) => onScheduledLocalChange(e.target.value)}
            min={minLocal ?? toLocalInputValue(new Date())}
            max={maxLocal}
          />
        </label>
      ) : null}
    </div>
  );
}

export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(local: string): string | null {
  if (!local.trim()) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function defaultLaterLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(0, 0, 0);
  return toLocalInputValue(d);
}

export function minReserveLocal(now = new Date()): string {
  return toLocalInputValue(new Date(now.getTime() + reserveMinMs()));
}

export function maxReserveLocal(now = new Date()): string {
  return toLocalInputValue(new Date(now.getTime() + reserveMaxMs()));
}
