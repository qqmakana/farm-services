"use client";

import { useEffect } from "react";
import { savePersonalLocation } from "@/lib/actions-locations";
import {
  clearPendingPlaceSave,
  readPendingPlaceSaves,
  upsertSavedPlaceCache,
} from "@/lib/saved-places-cache";

/** Sync locally queued place saves when the network comes back. */
export function FlushPendingPlaces() {
  useEffect(() => {
    async function flush() {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return;
      }
      const pending = readPendingPlaceSaves();
      for (const item of pending) {
        const { client_id, ...input } = item;
        try {
          const row = await savePersonalLocation(input);
          upsertSavedPlaceCache(input.guest_phone, row);
          clearPendingPlaceSave(client_id);
        } catch {
          /* keep queued */
        }
      }
    }
    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  return null;
}
