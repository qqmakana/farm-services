"use client";

import { useEffect } from "react";
import { isStandaloneDisplay } from "@/lib/pwa-install";

/**
 * Play Store TWA + installed PWA: unregister ALL service workers and wipe caches.
 * Old SW v3 served the home page for /ride and caused "Try again" on every tap.
 * Web updates do NOT require a new AAB — the bundle only opens village-ride.vercel.app.
 */
export function PwaRecover() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    void (async () => {
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

      // Standalone / Play Store TWA: one reload after purge so fresh bundles load.
      if (isStandaloneDisplay()) {
        try {
          if (sessionStorage.getItem("vr_pwa_purged_v6") === "1") return;
          sessionStorage.setItem("vr_pwa_purged_v6", "1");
          window.location.reload();
        } catch {
          window.location.reload();
        }
      }
    })();
  }, []);

  return null;
}
