import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";

export function waLink(text: string): string {
  return `${BRAND_WHATSAPP_HREF}?text=${encodeURIComponent(text)}`;
}

export const WhatsAppLinks = {
  support: () =>
    waLink(`Hi ${BRAND.appName} support — I need help with my account.`),
  shareTrip: (tripUrl: string, code: string) =>
    waLink(`Track my ${BRAND.appName} delivery ${code}: ${tripUrl}`),
  inviteBusiness: (shareUrl: string, code: string) =>
    waLink(
      `Join ${BRAND.appName} as a partner (free). Use my code ${code}: ${shareUrl}`,
    ),
  driverSignup: (joinUrl: string) =>
    waLink(
      `I want to drive with ${BRAND.appName}. Keep 85% of every trip. Apply: ${joinUrl}`,
    ),
  chatUs: () =>
    waLink(`Hi ${BRAND.appName} — I'd like to chat about driving / delivering.`),
} as const;
