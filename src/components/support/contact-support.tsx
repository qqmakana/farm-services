import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";
import { WhatsAppLinks } from "@/lib/whatsapp-links";

type Props = {
  /** Extra WhatsApp message context (e.g. trip ref). */
  whatsappPrefill?: string;
  /** Compact layout for trip / error surfaces. */
  compact?: boolean;
  className?: string;
};

export function supportEmailHref(subject?: string, body?: string) {
  const params = new URLSearchParams();
  params.set("subject", subject || `${BRAND.appName} support`);
  if (body) params.set("body", body);
  return `mailto:${BRAND.email}?${params.toString()}`;
}

/** WhatsApp + email CTAs using Sandton Streets support contacts. */
export function ContactSupportActions({
  whatsappPrefill,
  compact = false,
  className = "",
}: Props) {
  const wa = whatsappPrefill
    ? `${BRAND_WHATSAPP_HREF}?text=${encodeURIComponent(whatsappPrefill)}`
    : WhatsAppLinks.support();

  return (
    <div
      className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"} ${className}`}
    >
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className={`ru-btn !bg-[#25D366] text-center text-white hover:!bg-[#1ebe57] ${
          compact ? "!min-h-10 !px-3 !text-xs" : ""
        }`}
      >
        WhatsApp {BRAND.phone}
      </a>
      <a
        href={supportEmailHref(
          `${BRAND.appName} support`,
          `Hi ${BRAND.appName} support,\n\nI need help with:\n\n`,
        )}
        className={`ru-btn ru-btn-secondary text-center ${
          compact ? "!min-h-10 !px-3 !text-xs" : ""
        }`}
      >
        Email {BRAND.email}
      </a>
    </div>
  );
}
