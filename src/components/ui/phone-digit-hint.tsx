"use client";

import { phoneDigitFeedback } from "@/lib/phone";

/** Live “too few / too many digits” hint under a phone field. */
export function PhoneDigitHint({
  phone,
  countryCode,
}: {
  phone: string;
  countryCode?: string | null;
}) {
  const hint = phoneDigitFeedback(phone, countryCode);
  if (!hint.message) return null;
  return (
    <p
      data-testid="phone-digit-hint"
      role="status"
      className={`mt-1 text-[13px] font-medium ${
        hint.status === "ok" ? "text-[#05944F]" : "text-[#b01000]"
      }`}
    >
      {hint.message}
    </p>
  );
}
