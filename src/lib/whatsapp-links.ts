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
      `I want to drive with ${BRAND.appName} — rides, deliveries & farm jobs. Keep 90%. Apply: ${joinUrl}`,
    ),
  chatUs: () =>
    waLink(
      `Hi ${BRAND.appName} — I'd like to chat about driving (rides, delivery & farm).`,
    ),
  dispute: (code: string, extra?: string) =>
    waLink(
      [
        `Hi ${BRAND.appName} — DISPUTE`,
        `Order/trip: ${code}`,
        extra?.trim() || "Please help. I need a refund or the shop/driver issue resolved.",
      ].join("\n"),
    ),
  messageOtherParty: (code: string, role: "driver" | "rider" | "shop", text: string) =>
    waLink(
      [
        `Hi ${BRAND.appName} — please pass this to my ${role} for ${code}.`,
        "Do not share my phone number.",
        text.trim() || "(type your message here)",
      ].join("\n"),
    ),
  downtime: () =>
    waLink(
      `Village Ride is down. We're fixing it. You'll get a message here when it's back.`,
    ),
} as const;
