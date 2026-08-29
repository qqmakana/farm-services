"use client";

import { useRef, useState, useTransition } from "react";
import { uploadDriverLiveSelfie } from "@/lib/actions";
import { jobDetailString } from "@/lib/job-status";

export function LiveSelfieCard({
  jobId,
  driverId,
  details,
  onSaved,
}: {
  jobId: string;
  driverId: string;
  details: unknown;
  onSaved?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const existing = jobDetailString(details, "driver_live_selfie_url");

  function onFile(file: File | null) {
    if (!file) return;
    const fd = new FormData();
    fd.set("jobId", jobId);
    fd.set("driverId", driverId);
    fd.set("photo", file);
    setMsg(null);
    start(async () => {
      try {
        await uploadDriverLiveSelfie(fd);
        setMsg("Photo sent to the rider.");
        onSaved?.();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not send photo");
      }
    });
  }

  return (
    <div
      data-testid="driver-live-selfie"
      className="rounded-[var(--ru-radius)] bg-[var(--ru-elevated)] p-3"
    >
      <p className="text-sm font-semibold text-black">Live photo for rider</p>
      <p className="mt-1 text-xs text-[var(--ru-muted)]">
        After you accept, send a selfie so the rider can match you before
        pickup. Do not block the trip if the camera fails — they can still
        call you.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        disabled={pending}
        className="ru-btn ru-btn-secondary ru-btn-block mt-3"
        onClick={() => inputRef.current?.click()}
      >
        {pending
          ? "Sending…"
          : existing
            ? "Update selfie"
            : "Take selfie now"}
      </button>
      {msg ? (
        <p className="mt-2 text-xs text-[var(--ru-muted)]">{msg}</p>
      ) : null}
    </div>
  );
}
