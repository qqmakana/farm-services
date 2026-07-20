/**
 * Multi-country Village Ride config.
 * South Africa remains default; enable markets via `enabled`.
 */

export type CountryCode = "ZA" | "KE" | "NG" | "GH" | "IN" | "PH";

export type PaymentMethodId =
  | "cash"
  | "paypal"
  | "eft"
  | "mpesa"
  | "paystack"
  | "card";

export type AppLocale = "en" | "xh" | "sw" | "yo" | "ak" | "hi" | "tl";

export type CountryPricing = {
  currency: string;
  commissionPct: number;
  /** Ride (car / sedan) */
  ride: { base: number; perKm: number };
  /** Village delivery (bakkie / goods) */
  delivery: { base: number; perKm: number };
  /** Farm Connect */
  farm: { base: number; perKm: number };
  /** Heavy truck surcharge base */
  truck: { base: number; perKm: number };
};

export type CountryConfig = {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  /** National number length after dropping leading 0 / country code (approx). */
  phoneLocalDigits: number;
  language: AppLocale;
  languageLabel: string;
  locale: string;
  timezone: string;
  mapCenter: { lat: number; lng: number };
  payments: PaymentMethodId[];
  landmarkHints: readonly string[];
  pricing: CountryPricing;
  /** Feature flag — only enabled countries appear in the picker. */
  enabled: boolean;
};

export const DEFAULT_COUNTRY: CountryCode = "ZA";

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  ZA: {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    currencySymbol: "R",
    phonePrefix: "27",
    phoneLocalDigits: 9,
    language: "xh",
    languageLabel: "isiXhosa",
    locale: "en-ZA",
    timezone: "Africa/Johannesburg",
    mapCenter: { lat: -31.5833, lng: 28.7833 },
    payments: ["cash", "paypal", "eft"],
    landmarkHints: [
      "Main taxi rank",
      "Clinic",
      "Opposite the school",
      "Village / town entrance",
      "Church gate",
      "Spaza / shop corner",
      "Community hall",
      "Soccer ground",
      "Police station",
      "Market / mall",
      "Big blue gate",
      "Under the big tree",
      "Water tank",
      "Primary school",
      "Hospital",
      "Bus rank",
    ],
    pricing: {
      currency: "ZAR",
      commissionPct: 15,
      ride: { base: 50, perKm: 8 },
      delivery: { base: 80, perKm: 10 },
      farm: { base: 180, perKm: 12 },
      truck: { base: 450, perKm: 18 },
    },
    enabled: true,
  },
  KE: {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    currencySymbol: "KSh",
    phonePrefix: "254",
    phoneLocalDigits: 9,
    language: "sw",
    languageLabel: "Swahili",
    locale: "en-KE",
    timezone: "Africa/Nairobi",
    mapCenter: { lat: -1.2921, lng: 36.8219 },
    payments: ["cash", "mpesa"],
    landmarkHints: [
      "Near the matatu stage",
      "Next to the clinic",
      "Opposite the school",
      "Village entrance",
      "Church gate",
      "Kiosk / shop corner",
      "Community hall",
      "Football ground",
      "Police station",
      "Market",
      "Big blue gate",
      "Under the big tree",
      "Water point",
      "Primary school",
      "Hospital",
      "Bus stage",
    ],
    pricing: {
      currency: "KES",
      commissionPct: 15,
      ride: { base: 100, perKm: 25 },
      delivery: { base: 200, perKm: 35 },
      farm: { base: 400, perKm: 45 },
      truck: { base: 900, perKm: 60 },
    },
    enabled: true,
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    currencySymbol: "₦",
    phonePrefix: "234",
    phoneLocalDigits: 10,
    language: "yo",
    languageLabel: "Yoruba",
    locale: "en-NG",
    timezone: "Africa/Lagos",
    mapCenter: { lat: 6.5244, lng: 3.3792 },
    payments: ["cash", "paystack"],
    landmarkHints: [
      "Near the motor park",
      "Next to the clinic",
      "Opposite the school",
      "Village / town entrance",
      "Church / mosque gate",
      "Provision shop corner",
      "Town hall",
      "Football field",
      "Police station",
      "Market",
      "Big gate",
      "Under the big tree",
      "Borehole",
      "Primary school",
      "Hospital",
      "Bus stop",
    ],
    pricing: {
      currency: "NGN",
      commissionPct: 15,
      ride: { base: 500, perKm: 80 },
      delivery: { base: 1000, perKm: 120 },
      farm: { base: 2000, perKm: 150 },
      truck: { base: 5000, perKm: 200 },
    },
    enabled: true,
  },
  GH: {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    currencySymbol: "GH₵",
    phonePrefix: "233",
    phoneLocalDigits: 9,
    language: "ak",
    languageLabel: "Twi",
    locale: "en-GH",
    timezone: "Africa/Accra",
    mapCenter: { lat: 5.6037, lng: -0.187 },
    payments: ["cash", "paystack"],
    landmarkHints: [
      "Near the trotro station",
      "Next to the clinic",
      "Opposite the school",
      "Village entrance",
      "Church gate",
      "Provision shop",
      "Community centre",
      "Football park",
      "Police station",
      "Market",
      "Big gate",
      "Under the big tree",
      "Borehole",
      "Primary school",
      "Hospital",
      "Lorry station",
    ],
    pricing: {
      currency: "GHS",
      commissionPct: 15,
      ride: { base: 15, perKm: 3 },
      delivery: { base: 30, perKm: 5 },
      farm: { base: 60, perKm: 8 },
      truck: { base: 150, perKm: 12 },
    },
    enabled: true,
  },
  IN: {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    currency: "INR",
    currencySymbol: "₹",
    phonePrefix: "91",
    phoneLocalDigits: 10,
    language: "hi",
    languageLabel: "Hindi",
    locale: "en-IN",
    timezone: "Asia/Kolkata",
    mapCenter: { lat: 28.6139, lng: 77.209 },
    payments: ["cash", "paystack"],
    landmarkHints: [
      "Near the bus stand",
      "Next to the clinic",
      "Opposite the school",
      "Village entrance",
      "Temple / church gate",
      "Kirana shop corner",
      "Panchayat hall",
      "Playground",
      "Police station",
      "Mandi / market",
      "Big gate",
      "Under the banyan tree",
      "Hand pump",
      "Primary school",
      "Hospital",
      "Auto stand",
    ],
    pricing: {
      currency: "INR",
      commissionPct: 15,
      ride: { base: 80, perKm: 12 },
      delivery: { base: 150, perKm: 18 },
      farm: { base: 300, perKm: 25 },
      truck: { base: 700, perKm: 35 },
    },
    enabled: true,
  },
  PH: {
    code: "PH",
    name: "Philippines",
    flag: "🇵🇭",
    currency: "PHP",
    currencySymbol: "₱",
    phonePrefix: "63",
    phoneLocalDigits: 10,
    language: "tl",
    languageLabel: "Filipino",
    locale: "en-PH",
    timezone: "Asia/Manila",
    mapCenter: { lat: 14.5995, lng: 120.9842 },
    payments: ["cash", "paystack"],
    landmarkHints: [
      "Near the jeepney stop",
      "Next to the clinic",
      "Opposite the school",
      "Barangay entrance",
      "Church gate",
      "Sari-sari store",
      "Barangay hall",
      "Basketball court",
      "Police station",
      "Palengke / market",
      "Big gate",
      "Under the big tree",
      "Water pump",
      "Elementary school",
      "Hospital",
      "Terminal",
    ],
    pricing: {
      currency: "PHP",
      commissionPct: 15,
      ride: { base: 80, perKm: 15 },
      delivery: { base: 150, perKm: 22 },
      farm: { base: 350, perKm: 30 },
      truck: { base: 800, perKm: 40 },
    },
    enabled: true,
  },
};

export function isCountryCode(value: unknown): value is CountryCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(COUNTRIES, value)
  );
}

export function getCountry(code?: string | null): CountryConfig {
  if (isCountryCode(code) && COUNTRIES[code].enabled) {
    return COUNTRIES[code];
  }
  return COUNTRIES[DEFAULT_COUNTRY];
}

/** Countries shown in the selector (feature-flagged). */
export function enabledCountries(): CountryConfig[] {
  return (Object.values(COUNTRIES) as CountryConfig[]).filter((c) => c.enabled);
}

export function currencyForCountry(code?: string | null): string {
  return getCountry(code).currency;
}

export function paymentLabel(method: PaymentMethodId): string {
  switch (method) {
    case "cash":
      return "Cash";
    case "paypal":
      return "PayPal";
    case "eft":
      return "EFT / eWallet";
    case "mpesa":
      return "M-Pesa";
    case "paystack":
      return "Paystack";
    case "card":
      return "Card";
  }
}

export function paymentHint(method: PaymentMethodId): string {
  switch (method) {
    case "cash":
      return "Pay the driver when your trip starts.";
    case "paypal":
      return "Pay online with PayPal.";
    case "eft":
      return "Bank transfer / eWallet to Village Ride.";
    case "mpesa":
      return "M-Pesa checkout coming soon — cash works today.";
    case "paystack":
      return "Card / mobile money via Paystack — coming soon.";
    case "card":
      return "Card payment.";
  }
}

export const AVAILABLE_IN_FLAGS = enabledCountries()
  .map((c) => c.flag)
  .join(" ");
