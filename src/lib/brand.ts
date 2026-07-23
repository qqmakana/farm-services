/** Product + company identity */
export const BRAND = {
  appName: "Village Ride",
  company: "Sandton Streets",
  email: "ai@sandtonstreets.com",
  /** Display format */
  phone: "063 621 3590",
  /** Same number for WhatsApp / wa.me (SA → 27…) */
  phoneWhatsApp: "27636213590",
  street: "97 Perth Road",
  suburb: "Westdene",
  city: "Johannesburg",
  postalCode: "2092",
  country: "South Africa",
} as const;

export const BRAND_ADDRESS_LINE = `${BRAND.street}, ${BRAND.suburb}, ${BRAND.city}, ${BRAND.postalCode}`;

export const BRAND_TAGLINE =
  "Book rides, delivery, courier & Farm Connect via WhatsApp — by Sandton Streets";

export const BRAND_FULL = `${BRAND.appName} by ${BRAND.company}`;

export const BRAND_TEL_HREF = `tel:+${BRAND.phoneWhatsApp}`;
export const BRAND_WHATSAPP_HREF = `https://wa.me/${BRAND.phoneWhatsApp}`;

/**
 * Brand WhatsApp estimate line — uses currency symbol when provided.
 */
export type BookingWhatsAppDraft = {
  service_type: "ride" | "delivery" | "farm" | "courier";
  pickup_landmark: string;
  dropoff_landmark: string;
  customer_name: string;
  customer_phone: string;
  detailsLine: string;
  paymentLabel: "Cash" | "Card";
  estimateZar?: number;
  currencySymbol?: string;
};

function serviceLabelForWhatsApp(
  service: BookingWhatsAppDraft["service_type"],
): string {
  switch (service) {
    case "ride":
      return "Village Ride";
    case "delivery":
      return "Village Delivery";
    case "farm":
      return "Farm Connect";
    case "courier":
      return "Village Courier";
  }
}

/** Free MVP booking: pre-filled WhatsApp to Sandton Streets dispatch. */
export function buildBookingWhatsAppMessage(draft: BookingWhatsAppDraft): string {
  const lines = [
    `Hi ${BRAND.appName}! I need a booking:`,
    `- Service: ${serviceLabelForWhatsApp(draft.service_type)}`,
    `- Pickup: ${draft.pickup_landmark || "—"}`,
    `- Dropoff: ${draft.dropoff_landmark || "—"}`,
    `- Details: ${draft.detailsLine || "—"}`,
    `- Name: ${draft.customer_name || "—"}`,
    `- Phone: ${draft.customer_phone || "—"}`,
  ];
  if (draft.estimateZar != null && Number.isFinite(draft.estimateZar)) {
    const sym = draft.currencySymbol ?? "R";
    lines.push(`- Estimate: ${sym}${Math.round(draft.estimateZar)}`);
  }
  lines.push(`- Payment: ${draft.paymentLabel}`);
  lines.push("Please confirm my booking.");
  return lines.join("\n");
}

export function bookingWhatsAppHref(draft: BookingWhatsAppDraft): string {
  const text = buildBookingWhatsAppMessage(draft);
  return `https://wa.me/${BRAND.phoneWhatsApp}?text=${encodeURIComponent(text)}`;
}

/** Share a pre-filled trip message (opens WhatsApp contact picker). */
export function whatsappTripShareHref(pickup: string, dropoff: string) {
  const text = `Hi! I just booked a trip on ${BRAND.appName}. Pickup: ${pickup}, Dropoff: ${dropoff}. Driver is on the way!`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** SMS emergency alert to Sandton Streets support line. */
export function emergencySmsHref(mapsUrl: string) {
  const body = `EMERGENCY: I need help. My current location is ${mapsUrl}`;
  return `sms:${BRAND.phone}?body=${encodeURIComponent(body)}`;
}

export function emergencyMailtoHref(mapsUrl: string) {
  const subject = encodeURIComponent(`${BRAND.appName} EMERGENCY`);
  const body = encodeURIComponent(
    `EMERGENCY: I need help.\nMy current location: ${mapsUrl}\nPlease call me urgently.`,
  );
  return `mailto:${BRAND.email}?subject=${subject}&body=${body}`;
}

import { isValidMobileForCountry } from "./phone";

/** True for SA mobile numbers (0xx… or 27…). Prefer isValidMobileForCountry. */
export function isSouthAfricanMobile(phone: string): boolean {
  return isValidMobileForCountry(phone, "ZA");
}

export { isValidMobileForCountry };
