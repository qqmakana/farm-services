"use client";

import { useEffect, useState } from "react";
import {
  getOrCreateReferralCode,
  referralShareUrl,
} from "@/lib/rider-referral";
import { getGuestProfile } from "@/lib/guest-profile";
import { BRAND } from "@/lib/brand";

/** Uber-soft referral card — no green WhatsApp FAB styling. */
export function RiderReferralCard() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const phone = getGuestProfile()?.phone;
    setCode(getOrCreateReferralCode(phone));
  }, []);

  if (!code) return null;

  const shareUrl = referralShareUrl(code);
  const shareText = `Try ${BRAND.appName} — use my code ${code}: ${shareUrl}`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: BRAND.appName, text: shareText, url: shareUrl });
        return;
      }
    } catch {
      /* fall through */
    }
    await navigator.clipboard?.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl bg-gray-50 p-4">
      <p className="text-sm font-bold text-black">Invite friends</p>
      <p className="mt-1 text-xs text-gray-500">
        Share your code — get R50 when they complete a ride
      </p>
      <p className="mt-3 rounded-xl bg-white px-3 py-2.5 text-center font-mono text-lg font-bold tracking-wider text-black">
        {code}
      </p>
      <button
        type="button"
        onClick={() => void share()}
        className="uber-press uber-btn-black mt-3 w-full !min-h-11 !text-sm"
      >
        {copied ? "Copied" : "Share invite"}
      </button>
    </section>
  );
}
