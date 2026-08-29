"use client";

import { useEffect, useState, useTransition } from "react";
import {
  confirmDriverSelfie,
  confirmSafeArrival,
  getDriverDisplayPhotos,
  triggerSos,
} from "@/lib/actions";
import { jobDetailString } from "@/lib/job-status";
import {
  getSafetySettings,
  messageContainsPanicCode,
  safetyContactSmsHref,
  safetyContactWhatsAppHref,
} from "@/lib/safety-settings";
import type { JobWithDriver } from "@/lib/types";

const SAFE_ARRIVAL_PROMPT_MS = 5 * 60 * 1000;

export function TripSafetyPanel({
  job,
  onJob,
  showSelfie,
  showPanic,
  showArrival,
}: {
  job: JobWithDriver;
  onJob: (job: JobWithDriver) => void;
  showSelfie: boolean;
  showPanic: boolean;
  showArrival: boolean;
}) {
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [chat, setChat] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [promptContact, setPromptContact] = useState(false);
  const [pending, start] = useTransition();
  const settings = typeof window === "undefined" ? null : getSafetySettings();
  const livePath = jobDetailString(job.details, "driver_live_selfie_url");
  const selfieOk = Boolean(
    jobDetailString(job.details, "rider_confirmed_driver_selfie_at"),
  );
  const arrivedOk = Boolean(jobDetailString(job.details, "safe_arrival_at"));

  useEffect(() => {
    if (!livePath) {
      setSelfieUrl(null);
      return;
    }
    void getDriverDisplayPhotos({ selfie_url: livePath }).then((p) => {
      setSelfieUrl(p.selfie);
    });
  }, [livePath]);

  useEffect(() => {
    if (!showArrival || arrivedOk) return;
    const t = window.setTimeout(
      () => setPromptContact(true),
      SAFE_ARRIVAL_PROMPT_MS,
    );
    return () => window.clearTimeout(t);
  }, [showArrival, arrivedOk, job.completed_at]);

  function mapsUrl() {
    const lat = job.driver_lat ?? job.dropoff_lat ?? job.pickup_lat;
    const lng = job.driver_lng ?? job.dropoff_lng ?? job.pickup_lng;
    if (lat != null && lng != null) {
      return `https://maps.google.com/?q=${lat},${lng}`;
    }
    return `${window.location.origin}/trip/${job.reference_code}`;
  }

  function confirmSelfie() {
    setMsg(null);
    start(async () => {
      try {
        const next = await confirmDriverSelfie(job.id, job.customer_phone);
        onJob(next);
        setMsg("Thanks — that is your driver.");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not confirm");
      }
    });
  }

  function arrivedSafely() {
    setMsg(null);
    start(async () => {
      try {
        const next = await confirmSafeArrival(job.id, job.customer_phone);
        onJob(next);
        setPromptContact(false);
        setMsg("Glad you arrived safely.");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not confirm");
      }
    });
  }

  function sendPanic() {
    const code = settings?.panic_code || "";
    if (!messageContainsPanicCode(chat, code)) {
      setMsg("Type your 4-digit panic code from Safety to send a silent alert.");
      return;
    }
    setMsg(null);
    start(async () => {
      try {
        await triggerSos(job.id, "Silent panic code", job.driver_lat ?? undefined, job.driver_lng ?? undefined);
        setChat("");
        setMsg(
          "Silent alert logged. Open SMS or WhatsApp to your safety contact — we cannot send it for you.",
        );
        setPromptContact(true);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Alert failed");
      }
    });
  }

  const sms = safetyContactSmsHref(
    settings?.emergency_phone || "",
    mapsUrl(),
    job.customer_name,
  );
  const wa = safetyContactWhatsAppHref(
    settings?.emergency_phone || "",
    mapsUrl(),
    job.customer_name,
  );

  return (
    <div className="space-y-3" data-testid="trip-safety-panel">
      {showSelfie ? (
        <div
          data-testid="rider-driver-selfie"
          className="rounded-[16px] bg-[#F3F3F3] p-4"
        >
          <p className="text-[15px] font-bold">Is this your driver?</p>
          <p className="mt-1 text-[13px] text-[#6B6B6B]">
            Live photo after they accepted. Confirm before you get in.
          </p>
          {selfieUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selfieUrl}
              alt="Driver live selfie"
              className="mt-3 h-40 w-full rounded-[12px] object-cover"
            />
          ) : (
            <p className="mt-3 text-[13px] text-[#6B6B6B]">
              {livePath
                ? "Photo is on the way…"
                : "Waiting for the driver to send a live photo."}
            </p>
          )}
          {selfieOk ? (
            <p className="mt-3 text-[13px] font-semibold text-[#05944F]">
              You confirmed this driver.
            </p>
          ) : (
            <button
              type="button"
              disabled={pending || !livePath}
              onClick={confirmSelfie}
              className="uber-press mt-3 w-full min-h-11 rounded-full bg-black text-[15px] font-medium text-white disabled:opacity-50"
            >
              Yes — this is my driver
            </button>
          )}
        </div>
      ) : null}

      {showPanic ? (
        <div className="rounded-[16px] bg-[#F3F3F3] p-4">
          <p className="text-[15px] font-bold">Trip chat</p>
          <p className="mt-1 text-[13px] text-[#6B6B6B]">
            Type your panic code here for a silent alert. SOS below is the
            loud option.
          </p>
          <input
            data-testid="trip-panic-input"
            className="mt-3 w-full rounded-[12px] bg-white p-4 text-[17px] outline-none"
            placeholder="Message driver…"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
          />
          <button
            type="button"
            disabled={pending || !chat.trim()}
            onClick={sendPanic}
            className="uber-press mt-2 w-full min-h-11 rounded-full bg-white text-[15px] font-semibold text-black ring-1 ring-[#EEEEEE] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      ) : null}

      {showArrival && !arrivedOk ? (
        <div
          data-testid="safe-arrival"
          className="rounded-[16px] bg-[#F3F3F3] p-4"
        >
          <p className="text-[17px] font-bold">Did you arrive safely?</p>
          <p className="mt-1 text-[13px] text-[#6B6B6B]">
            Tap this before the trip closes on your side. The fare is already
            settled.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={arrivedSafely}
            className="uber-press mt-3 w-full min-h-12 rounded-full bg-black text-[17px] font-medium text-white disabled:opacity-50"
          >
            I arrived safely
          </button>
        </div>
      ) : null}

      {promptContact && (sms || wa) ? (
        <div className="rounded-[16px] bg-[#fdecea] p-4">
          <p className="text-[15px] font-bold text-[#b01000]">
            Ping your safety contact
          </p>
          <p className="mt-1 text-[13px] text-[#6B6B6B]">
            We cannot send the message for you. Open SMS or WhatsApp now.
          </p>
          <div className="mt-3 flex gap-2">
            {sms ? (
              <a
                href={sms}
                className="uber-press flex min-h-11 flex-1 items-center justify-center rounded-full bg-black text-[15px] font-medium text-white"
              >
                SMS
              </a>
            ) : null}
            {wa ? (
              <a
                href={wa}
                className="uber-press flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#25D366] text-[15px] font-semibold text-white"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {msg ? <p className="text-[13px] text-[#6B6B6B]">{msg}</p> : null}
    </div>
  );
}
