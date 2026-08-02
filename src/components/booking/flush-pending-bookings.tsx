"use client";

import { useEffect } from "react";
import { createCashJob } from "@/lib/actions";
import {
  clearPendingBooking,
  readPendingBookings,
} from "@/lib/offline-booking-queue";

/** Sync landmark bookings saved while offline. */
export function FlushPendingBookings() {
  useEffect(() => {
    async function flush() {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return;
      }
      const pending = readPendingBookings();
      for (const item of pending) {
        const { client_id, queued_at: _q, ...draft } = item;
        try {
          await createCashJob(draft);
          clearPendingBooking(client_id);
        } catch {
          /* keep queued — retry next online */
        }
      }
    }
    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  return null;
}
