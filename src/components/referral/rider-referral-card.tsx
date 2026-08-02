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
    <section className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Refer a friend
      </p>
      <p className="mt-1 text-sm font-bold text-black">
        Share your code — get R50 when they complete a ride
      </p>
      <p className="mt-2 rounded-lg bg-[#f5f5f5] px-3 py-2 text-center font-mono text-lg font-bold tracking-wider text-black">
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
          className="rounded-xl border border-slate-200 py-2 text-xs font-semibold text-black"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={waLink(
            `Try ${BRAND.appName} with my code ${code}: ${shareUrl}\n\nRides, delivery, farm & courier — villages to cities.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-[#25D366] py-2 text-center text-xs font-bold text-white"
        >
          WhatsApp
        </a>
        <a
          href={`sms:?body=${smsBody}`}
          className="rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-black"
        >
          SMS
        </a>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Friend signs up via your link. After their first completed trip, ops
        credits your R50 bonus.
      </p>
    </section>
  );
}
