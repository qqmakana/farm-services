"use client";

import { useState } from "react";
import { ChevronDown, Shield } from "lucide-react";

const TIPS = [
  "Share your trip link with family so they can track you live.",
  "Check the driver’s name, photo, and plate before you get in.",
  "Call the driver (or support) if anything feels wrong.",
  "Sit in the back when riding alone. Keep valuables with you.",
  "In an emergency, use SOS in the app and call 10111.",
] as const;

/** Collapsible safety tips on the trip tracking page. */
export function RiderSafetyTips() {
  const [open, setOpen] = useState(true);

  return (
    <section className="ru-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <Shield className="h-4 w-4 shrink-0 text-black" aria-hidden />
        <span className="flex-1 text-sm font-bold text-black">
          Rider safety tips
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--ru-muted)] transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="space-y-2 border-t border-[var(--ru-line)] px-4 py-3">
          {TIPS.map((tip) => (
            <li
              key={tip}
              className="flex gap-2 text-xs leading-relaxed text-[var(--ru-muted)]"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
              {tip}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
