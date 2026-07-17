"use client";

import { useEffect } from "react";

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

    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Ignore registration failures (private mode, etc.)
    });
  }, []);

  return null;
}
