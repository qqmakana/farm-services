import { toWhatsAppNumber } from "@/lib/whatsapp";

/** Uber-style one-tap messages — opens WhatsApp with prefilled text. */
export const RIDER_QUICK_REPLIES = [
  "I'm here",
  "Be right there",
  "I'm looking for you",
  "Which entrance are you at?",
] as const;

export const DRIVER_QUICK_REPLIES = [
  "I'm here",
  "Which entrance are you at?",
  "I'm looking for you",
  "Be right there",
] as const;

export function tripWhatsAppHref(
  phone: string | null | undefined,
  message: string,
  countryCode?: string | null,
): string | null {
  if (!phone?.trim()) return null;
  const wa = toWhatsAppNumber(phone, countryCode);
  if (!wa) return null;
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

export function leaveByLabel(etaMinutesValue: number | null): string | null {
  if (etaMinutesValue == null || etaMinutesValue <= 0) return null;
  const leave = new Date(Date.now() + Math.max(0, etaMinutesValue - 1) * 60_000);
  return leave.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
