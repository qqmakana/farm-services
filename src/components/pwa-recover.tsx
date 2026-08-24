"use client";

import { useEffect } from "react";

const SW_CACHE = "village-ride-v5";
const RELOAD_KEY = "vr_sw_reload_v5";

/** Clear broken v3 caches and reload once after the fixed worker activates. */
export function PwaRecover() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    void (async () => {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter(
                (k) => k.startsWith("village-ride-v") && k !== SW_CACHE,
              )
              .map((k) => caches.delete(k)),
          );
        }
      } catch {
        /* ignore */
      }

      if (!("serviceWorker" in navigator)) return;

      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.update();
        }
      } catch {
        /* ignore */
      }

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        try {
          if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
        } catch {
          window.location.reload();
        }
      });
    })();
  }, []);

  return null;
}
