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
  "Uber-like rides, shop & bulky delivery, Farm Connect — by Sandton Streets";

export const BRAND_FULL = `${BRAND.appName} by ${BRAND.company}`;

export const BRAND_TEL_HREF = `tel:+${BRAND.phoneWhatsApp}`;
export const BRAND_WHATSAPP_HREF = `https://wa.me/${BRAND.phoneWhatsApp}`;

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

/** True for SA mobile numbers (0xx… or 27…). */
export function isSouthAfricanMobile(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) {
    const local = digits.slice(2);
    return /^[6-8]\d{8}$/.test(local);
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return /^0[6-8]\d{8}$/.test(digits);
  }
  return false;
}
