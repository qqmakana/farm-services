"use client";

import { useEffect, useState } from "react";
import {
  looksLikeUnsupportedMarketTimezone,
  UNSUPPORTED_MARKET_MESSAGE,
} from "@/lib/countries";

/**
 * Soft notice for visitors whose device timezone looks like US/UK/EU/AU.
 * Does not hard-block — they can still pick a supported village market.
 */
export function UnsupportedMarketNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("vr_unsupported_dismissed") === "1") return;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (looksLikeUnsupportedMarketTimezone(tz)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[70] px-4 sm:bottom-6">
      <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
        <p className="flex-1 text-xs leading-relaxed text-amber-950">
          {UNSUPPORTED_MARKET_MESSAGE}
        </p>
        <button
          type="button"
          className="shrink-0 text-sm font-bold text-amber-900"
          onClick={() => {
            sessionStorage.setItem("vr_unsupported_dismissed", "1");
            setShow(false);
          }}
          aria-label="Dismiss"
        >
          OK
        </button>
      </div>
    </div>
  );
}
