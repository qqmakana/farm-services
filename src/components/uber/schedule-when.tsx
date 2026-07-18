"use client";

export type WhenMode = "now" | "later";

/** Ride Now vs Schedule for Later — shared across Ride / Delivery / Farm. */
export function ScheduleWhen({
  mode,
  onModeChange,
  scheduledLocal,
  onScheduledLocalChange,
  nowLabel = "Ride Now",
}: {
  mode: WhenMode;
  onModeChange: (mode: WhenMode) => void;
  /** value for datetime-local input */
  scheduledLocal: string;
  onScheduledLocalChange: (value: string) => void;
  nowLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[#1A4D3A]">When</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange("now")}
          className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
            mode === "now"
              ? "border-[#1A4D3A] bg-[#E8F5E9] text-[#1A4D3A]"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {nowLabel}
        </button>
        <button
          type="button"
          onClick={() => onModeChange("later")}
          className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
            mode === "later"
              ? "border-[#1A4D3A] bg-[#E8F5E9] text-[#1A4D3A]"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Schedule for Later
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Taxis not running? Book a verified ride or delivery in advance.
      </p>
      {mode === "later" ? (
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Date &amp; time
          <input
            type="datetime-local"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={scheduledLocal}
            onChange={(e) => onScheduledLocalChange(e.target.value)}
            min={toLocalInputValue(new Date())}
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

/** Convert datetime-local string → ISO for API / scheduled_for. */
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
