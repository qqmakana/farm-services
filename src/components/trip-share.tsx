"use client";

import { useState } from "react";
import { WhatsAppLinks } from "@/lib/whatsapp-links";
import { useToast } from "@/components/ui/toast";

export function TripShare({
  referenceCode,
  pickup,
  dropoff,
  className = "",
}: {
  referenceCode: string;
  pickup?: string;
  dropoff?: string;
  className?: string;
}) {
  const { success, error } = useToast();
  const [open, setOpen] = useState(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://village-ride.vercel.app";
  const url = `${origin}/trip/${referenceCode}`;
  const smsBody = encodeURIComponent(
    `Track your Village Ride delivery ${referenceCode}: ${url}`,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      success("Trip link copied");
      setOpen(false);
    } catch {
      error("Could not copy link");
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-black underline"
      >
        Share with customer
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Share trip"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-[#1e1e1e]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-black dark:text-white">
                  Share trip
                </p>
                <p className="mt-1 text-xs text-[var(--ru-muted)]">
                  {referenceCode}
                  {pickup && dropoff ? ` · ${pickup} → ${dropoff}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xl leading-none text-[var(--ru-muted)]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void copy()}
                className="ru-btn ru-btn-primary ru-btn-block"
              >
                Copy link
              </button>
              <a
                href={WhatsAppLinks.shareTrip(url, referenceCode)}
                target="_blank"
                rel="noreferrer"
                className="ru-btn ru-btn-block bg-[#25D366] text-white hover:bg-[#1ebe57]"
                onClick={() => setOpen(false)}
              >
                WhatsApp
              </a>
              <a
                href={`sms:?&body=${smsBody}`}
                className="ru-btn ru-btn-secondary ru-btn-block"
                onClick={() => setOpen(false)}
              >
                SMS
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
