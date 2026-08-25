"use client";

import { useState } from "react";
import { Calendar, Clock, X } from "lucide-react";
import {
  defaultLaterLocal,
  localInputToIso,
  maxReserveLocal,
  minReserveLocal,
  toLocalInputValue,
} from "@/components/uber/schedule-when";
import { reserveWindowError } from "@/lib/reserve-window";
import { SERVICE_COPY } from "@/lib/service-guide";

/** Mobile look-alike of Uber Reserve date/time pickers. */
export function HomeScheduleLaterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const [datePart, timePart] = scheduledLocal.split("T");

  function setDate(d: string) {
    setScheduledLocal(`${d}T${timePart || "12:00"}`);
    setError(null);
  }
  function setTime(t: string) {
    setScheduledLocal(`${datePart || toLocalInputValue(new Date()).slice(0, 10)}T${t}`);
    setError(null);
  }

  function confirm() {
    const iso = localInputToIso(scheduledLocal);
    if (!iso) {
      setError("Pick a valid date and time.");
      return;
    }
    const windowErr = reserveWindowError(iso);
    if (windowErr) {
      setError(windowErr);
      return;
    }
    setError(null);
    onClose();
    window.location.assign(`/ride?when=later&at=${encodeURIComponent(iso)}`);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-later-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#E5F1F1] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="home-later-title"
            className="text-xl font-bold tracking-tight text-black"
          >
            Schedule a Reserve
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="uber-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-sm font-medium text-black">Choose date and time</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-gray-600">
            Date
            <span className="mt-1 flex min-h-12 items-center gap-2 rounded-xl bg-white px-3">
              <Calendar className="h-4 w-4 text-black" aria-hidden />
              <input
                type="date"
                className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none"
                value={datePart || ""}
                min={minReserveLocal().slice(0, 10)}
                max={maxReserveLocal().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </span>
          </label>
          <label className="block text-xs font-semibold text-gray-600">
            Time
            <span className="mt-1 flex min-h-12 items-center gap-2 rounded-xl bg-white px-3">
              <Clock className="h-4 w-4 text-black" aria-hidden />
              <input
                type="time"
                data-testid="home-later-datetime"
                className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none"
                value={timePart || ""}
                onChange={(e) => setTime(e.target.value)}
              />
            </span>
          </label>
        </div>

        {error ? (
          <p className="mt-2 text-xs font-medium text-[#b01000]">{error}</p>
        ) : null}

        <ul className="mt-4 space-y-1.5 text-xs text-gray-700">
          <li>{SERVICE_COPY.reserve.blurb}</li>
        </ul>

        <button
          type="button"
          data-testid="home-later-confirm"
          onClick={confirm}
          className="uber-press mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-black text-sm font-semibold text-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}
