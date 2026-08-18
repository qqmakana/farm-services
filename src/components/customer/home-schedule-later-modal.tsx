"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  defaultLaterLocal,
  localInputToIso,
  toLocalInputValue,
} from "@/components/uber/schedule-when";

/** Uber-style Later — pick date/time on Home, then open scheduled ride flow. */
export function HomeScheduleLaterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function confirm() {
    const iso = localInputToIso(scheduledLocal);
    if (!iso) {
      setError("Pick a valid date and time.");
      return;
    }
    if (new Date(iso).getTime() <= Date.now()) {
      setError("Choose a time in the future.");
      return;
    }
    setError(null);
    onClose();
    router.push(`/ride?when=later&at=${encodeURIComponent(iso)}`);
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
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="home-later-title"
              className="text-lg font-bold tracking-tight text-black"
            >
              Schedule for later
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pick when you need a ride — taxis not running? Book ahead.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="uber-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <label className="mt-5 block text-sm font-semibold text-black">
          Date &amp; time
          <input
            type="datetime-local"
            data-testid="home-later-datetime"
            className="ru-soft-field mt-1.5 text-sm"
            value={scheduledLocal}
            onChange={(e) => {
              setScheduledLocal(e.target.value);
              setError(null);
            }}
            min={toLocalInputValue(new Date())}
          />
        </label>

        {error ? (
          <p className="mt-2 text-xs font-medium text-[#b01000]">{error}</p>
        ) : null}

        <button
          type="button"
          data-testid="home-later-confirm"
          onClick={confirm}
          className="uber-press uber-btn-black mt-5 w-full"
        >
          Continue to ride
        </button>
      </div>
    </div>
  );
}
