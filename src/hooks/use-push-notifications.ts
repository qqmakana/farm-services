"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  isFirebaseClientConfigured,
  requestFcmToken,
} from "@/lib/firebase/client";

export type PushSaveFn = (token: string) => Promise<unknown>;

/**
 * Shared push permission flow for merchants/drivers.
 * Does not auto-prompt — call `enable()` from UI.
 */
export function usePushNotifications(opts: {
  storageKey: string;
  saveToken: PushSaveFn;
}) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unknown">(
    "unknown",
  );
  const [dismissed, setDismissed] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const configured = isFirebaseClientConfigured();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "Notification" in window && "serviceWorker" in navigator;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
    setDismissed(localStorage.getItem(opts.storageKey) === "1");
  }, [opts.storageKey]);

  const dismiss = useCallback(() => {
    localStorage.setItem(opts.storageKey, "1");
    setDismissed(true);
  }, [opts.storageKey]);

  const enable = useCallback(() => {
    setStatus(null);
    startTransition(async () => {
      try {
        if (!configured) {
          setStatus(
            "Push needs Firebase web keys in env — orders still work in-app.",
          );
          return;
        }
        const token = await requestFcmToken();
        if (!token) {
          setStatus("Notifications blocked or unsupported on this device.");
          setPermission(
            typeof Notification !== "undefined"
              ? Notification.permission
              : "denied",
          );
          return;
        }
        await opts.saveToken(token);
        setPermission("granted");
        setStatus("Notifications on — you won't miss updates.");
        localStorage.setItem(opts.storageKey, "1");
        setDismissed(true);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Could not enable push");
      }
    });
  }, [configured, opts]);

  return {
    supported,
    permission,
    dismissed,
    status,
    pending,
    configured,
    dismiss,
    enable,
    showPrompt:
      supported &&
      !dismissed &&
      permission !== "granted" &&
      permission !== "denied",
  };
}
