"use client";

import { useEffect } from "react";
// Capture beforeinstallprompt as early as this client bundle loads
import "@/lib/pwa-install";

/** Registers the service worker so the site becomes installable. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // HTTPS or localhost only — browsers block SW elsewhere
    const secure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!secure) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              // Pick up fixed SW (v4+) without serving stale HTML for other routes.
              window.location.reload();
            }
          });
        });
        void registration.update();
      })
      .catch(() => {
        // Ignore registration failures (private mode, etc.)
      });
  }, []);

  return null;
}
