"use client";

import { useEffect } from "react";

/**
 * Unregister service workers + wipe caches once (no reload — reload loops break some TWAs).
 */
export function PwaRecover() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    void (async () => {
      try {
        if (localStorage.getItem("vr_pwa_purged_v7") === "1") return;
        localStorage.setItem("vr_pwa_purged_v7", "1");
      } catch {
        /* ignore */
      }

      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* ignore */
      }

      if (!("serviceWorker" in navigator)) return;

      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return null;
}
