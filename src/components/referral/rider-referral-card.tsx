"use client";

import { useEffect, useState } from "react";
import {
  getOrCreateReferralCode,
  referralShareUrl,
} from "@/lib/rider-referral";
import { getGuestProfile } from "@/lib/guest-profile";
import { waLink } from "@/lib/whatsapp-links";
import { BRAND } from "@/lib/brand";

/** Account card — share code, earn R50 when a friend rides. */
export function RiderReferralCard() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const phone = getGuestProfile()?.phone;
    setCode(getOrCreateReferralCode(phone));
  }, []);

  if (!code) return null;

  const shareUrl = referralShareUrl(code);
  const smsBody = encodeURIComponent(
    `Try ${BRAND.appName} — use my code ${code}: ${shareUrl}`,
  );

  return (
    <section className="ru-card mt-4 p-4">
      <p className="ru-section-label">Refer a friend</p>
      <p className="mt-1 text-sm font-bold text-black">
        Share your code — get R50 when they complete a ride
      </p>
      <p className="mt-2 rounded-[var(--ru-radius)] bg-[var(--ru-elevated)] px-3 py-2 text-center font-mono text-lg font-bold tracking-wider text-black">
        {code}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(`${code} ${shareUrl}`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
          className="ru-btn ru-btn-secondary !min-h-10 !px-2 !text-xs"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={waLink(
            `Try ${BRAND.appName} with my code ${code}: ${shareUrl}\n\nRides, delivery, farm & courier — villages to cities.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="ru-btn !min-h-10 !bg-[#25D366] !px-2 !text-xs !text-white"
        >
          WhatsApp
        </a>
        <a
          href={`sms:?body=${smsBody}`}
          className="ru-btn ru-btn-secondary !min-h-10 !px-2 !text-xs"
        >
          SMS
        </a>
      </div>
      <p className="mt-2 text-[11px] text-[var(--ru-muted)]">
        Friend signs up via your link. After their first completed trip, ops
        credits your R50 bonus.
      </p>
    </section>
  );
}
