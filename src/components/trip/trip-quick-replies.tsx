"use client";

import { tripWhatsAppHref } from "@/lib/trip-quick-replies";

export function TripQuickReplies({
  phone,
  countryCode,
  replies,
  prefix,
}: {
  phone: string | null | undefined;
  countryCode?: string | null;
  replies: readonly string[];
  /** Optional trip context prepended to every chip. */
  prefix?: string;
}) {
  if (!phone?.trim()) return null;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {replies.map((text) => {
        const body = prefix ? `${prefix}${text}` : text;
        const href = tripWhatsAppHref(phone, body, countryCode);
        if (!href) return null;
        return (
          <a
            key={text}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="uber-press shrink-0 rounded-full bg-gray-100 px-3.5 py-2 text-sm font-semibold text-black hover:bg-gray-200"
          >
            {text}
          </a>
        );
      })}
    </div>
  );
}
