"use client";

import { WhatsAppLinks } from "@/lib/whatsapp-links";

/** Relay via Village Ride WhatsApp — we do not share phone numbers (POPIA). */
export function TripRelayContact({
  code,
  peer,
  replies,
}: {
  code: string;
  peer: "driver" | "rider" | "shop";
  replies?: readonly string[];
}) {
  const label =
    peer === "driver"
      ? "Message driver"
      : peer === "shop"
        ? "Message shop"
        : "Message rider";
  return (
    <div className="space-y-2">
      <a
        href={WhatsAppLinks.messageOtherParty(
          code,
          peer,
          peer === "driver"
            ? "I'm at a different gate / I'll be 10 min. Please tell the driver."
            : peer === "shop"
              ? "Is a substitute brand OK if you're out of stock?"
              : "Running 10 min late. Please tell the rider.",
        )}
        className="uber-press flex min-h-11 items-center justify-center rounded-full border border-[#E0E0E0] bg-white px-4 text-[14px] font-semibold text-[#111111] no-underline"
      >
        {label} →
      </a>
      {replies && replies.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {replies.map((text) => (
            <a
              key={text}
              href={WhatsAppLinks.messageOtherParty(code, peer, text)}
              className="uber-press rounded-full bg-[#F3F3F3] px-3 py-1.5 text-[12px] font-semibold text-[#111111] no-underline"
            >
              {text}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
