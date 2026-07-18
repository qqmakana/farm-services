"use client";

import { useEffect, useState, useTransition } from "react";
import { saveDriverFcmToken } from "@/lib/actions";
import {
  isFirebaseClientConfigured,
  requestFcmToken,
} from "@/lib/firebase/client";

/** Ask drivers to allow free FCM push so they get job offers instantly. */
export function DriverPushPrompt({ driverId }: { driverId: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const configured = isFirebaseClientConfigured();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(`vr-fcm-dismiss-${driverId}`)) {
      setDismissed(true);
    }
  }, [driverId]);

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(`vr-fcm-dismiss-${driverId}`, "1");
    setDismissed(true);
  }

  function enable() {
    setStatus(null);
    startTransition(async () => {
      try {
        if (!configured) {
          setStatus(
            "Add free Firebase web keys to .env — until then, jobs still appear on this screen.",
          );
          return;
        }
        const token = await requestFcmToken();
        if (!token) {
          setStatus("Notifications blocked or unsupported on this device.");
          return;
        }
        await saveDriverFcmToken(driverId, token);
        setStatus("Notifications on — you'll get job offers as push alerts.");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Could not enable push");
      }
    });
  }

  return (
    <div className="rounded-xl border border-[#1A4D3A]/25 bg-[#E8F5E9] px-4 py-3">
      <p className="text-sm font-semibold text-[#1A4D3A]">
        Allow notifications to receive jobs?
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Free Firebase push — when you&apos;re online, new jobs ping your phone
        instantly.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={enable}
          className="rounded-lg bg-[#1A4D3A] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Enabling…" : "Allow notifications"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Not now
        </button>
      </div>
      {status ? (
        <p className="mt-2 text-xs text-[#1A4D3A]">{status}</p>
      ) : null}
    </div>
  );
}
