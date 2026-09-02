"use client";

import { WhatsAppLinks } from "@/lib/whatsapp-links";

export function DisputeButton({
  code,
  extra,
  className = "",
}: {
  code: string;
  extra?: string;
  className?: string;
}) {
  return (
    <a
      href={WhatsAppLinks.dispute(code, extra)}
      className={`uber-press uber-btn-outline inline-flex no-underline ${className}`}
    >
      Dispute
    </a>
  );
}
