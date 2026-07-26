/**
 * Multi-country Village Ride config — emerging rural markets only.
 *
 * Strategy: villages in Africa, Asia, and Latin America.
 * NOT targeting US, UK, Canada, Australia, or Western Europe
 * (Uber/Lyft saturation, high CAC, different problem set).
 */

export type CountryCode =
  | "ZA"
  | "KE"
  | "NG"
  | "GH"
  | "TZ"
  | "KZ"
  | "NA"
  | "BW"
  | "EG"
  | "PK"
  | "BR"
  | "IN"
  | "PH"
  | "MX"
  | "ID"
  | "VN"
  | "TH"
  | "CO"
  | "PE"
  | "UZ"
  | "KG"
  | "MN";

export type PaymentMethodId =
  | "cash"
  | "paypal"
  | "eft"
  | "mpesa"
  | "paystack"
  | "card"
  | "mtn_momo"
  | "bank_transfer"
  | "kaspi"
  | "pix"
  | "upi"
  | "gcash"
  | "gopay"
  | "ovo"
  | "momo_vn"
  | "promptpay";

export type AppLocale =
  | "en"
  | "xh"
  | "zu"
  | "af"
  | "sw"
  | "yo"
  | "ha"
  | "ig"
  | "ak"
  | "hi"
  | "ta"
  | "te"
  | "tl"
  | "pt"
  | "es"
  | "id"
  | "th"
  | "vi"
  | "kk"
  | "ru"
  | "ar"
  | "ur"
  | "mn"
  | "uz"
  | "ky";

export type LocalRideMode = {
  id: "boda" | "okada" | "auto" | "tuktuk" | "tricycle";
  label: string;
};

export type CountryPricing = {
  currency: string;
  commissionPct: number;
  ride: { base: number; perKm: number };
  delivery: { base: number; perKm: number };
  farm: { base: number; perKm: number };
  truck: { base: number; perKm: number };
  motorcycle: { base: number; perKm: number };
};

export type LanguageOption = { code: AppLocale | "en"; label: string };

export type CountryConfig = {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  phoneLocalDigits: number;
  /** Primary local language code (non-English). */
  language: AppLocale;
  languageLabel: string;
  languages: LanguageOption[];
  locale: string;
  timezone: string;
  mapCenter: { lat: number; lng: number };
  payments: PaymentMethodId[];
  landmarkHints: readonly string[];
  pricing: CountryPricing;
  /** Country-specific ride modes (Boda, Okada, Auto, etc.). */
  localRideModes: LocalRideMode[];
  enabled: boolean;
};

export const DEFAULT_COUNTRY: CountryCode = "ZA";

const RURAL_HINTS = [
  "Main taxi rank / bus stage",
  "Clinic / hospital",
  "Opposite the school",
  "Village / town entrance",
  "Church or mosque gate",
  "Shop / market corner",
  "Community hall",
  "Sports ground",
  "Police station",
  "Under the big tree",
  "Water point",
  "Primary school",
] as const;

function pricingFromMin(
  currency: string,
  min: number,
  perKm: number,
): CountryPricing {
  return {
    currency,
    commissionPct: 15,
    ride: { base: min, perKm },
    delivery: {
      base: Math.max(min, Math.round(min * 1.6)),
      perKm: Math.max(perKm, Math.round(perKm * 1.2)),
    },
    farm: {
      base: Math.max(min, Math.round(min * 3)),
      perKm: Math.max(perKm, Math.round(perKm * 1.5)),
    },
    truck: {
      base: Math.max(min, Math.round(min * 6)),
      perKm: Math.max(perKm, Math.round(perKm * 2)),
    },
    motorcycle: {
      base: Math.max(1, Math.round(min * 0.7)),
      perKm: Math.max(1, Math.round(perKm * 0.8)),
    },
  };
}

function country(
  partial: Omit<CountryConfig, "landmarkHints" | "enabled" | "localRideModes"> & {
    landmarkHints?: readonly string[];
    localRideModes?: LocalRideMode[];
    enabled?: boolean;
  },
): CountryConfig {
  return {
    ...partial,
    landmarkHints: partial.landmarkHints ?? RURAL_HINTS,
    localRideModes: partial.localRideModes ?? [],
    enabled: partial.enabled ?? true,
  };
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  ZA: country({
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    currencySymbol: "R",
    phonePrefix: "27",
    phoneLocalDigits: 9,
    language: "xh",
    languageLabel: "isiXhosa",
    languages: [
      { code: "en", label: "English" },
      { code: "af", label: "Afrikaans" },
      { code: "xh", label: "isiXhosa" },
      { code: "zu", label: "isiZulu" },
    ],
    locale: "en-ZA",
    timezone: "Africa/Johannesburg",
    mapCenter: { lat: -31.5833, lng: 28.7833 },
    payments: ["cash", "paypal", "eft"],
    pricing: pricingFromMin("ZAR", 30, 10),
  }),
  KE: country({
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    currencySymbol: "KSh",
    phonePrefix: "254",
    phoneLocalDigits: 9,
    language: "sw",
    languageLabel: "Swahili",
    languages: [
      { code: "en", label: "English" },
      { code: "sw", label: "Swahili" },
    ],
    locale: "en-KE",
    timezone: "Africa/Nairobi",
    mapCenter: { lat: -1.2921, lng: 36.8219 },
    payments: ["cash", "mpesa"],
    localRideModes: [{ id: "boda", label: "Boda (motorcycle)" }],
    pricing: pricingFromMin("KES", 300, 100),
  }),
  NG: country({
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    currencySymbol: "₦",
    phonePrefix: "234",
    phoneLocalDigits: 10,
    language: "yo",
    languageLabel: "Yoruba",
    languages: [
      { code: "en", label: "English" },
      { code: "ha", label: "Hausa" },
      { code: "yo", label: "Yoruba" },
      { code: "ig", label: "Igbo" },
    ],
    locale: "en-NG",
    timezone: "Africa/Lagos",
    mapCenter: { lat: 6.5244, lng: 3.3792 },
    payments: ["cash", "bank_transfer", "paystack"],
    localRideModes: [{ id: "okada", label: "Okada (motorcycle)" }],
    pricing: pricingFromMin("NGN", 1500, 500),
  }),
  GH: country({
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    currencySymbol: "GH₵",
    phonePrefix: "233",
    phoneLocalDigits: 9,
    language: "ak",
    languageLabel: "Twi",
    languages: [
      { code: "en", label: "English" },
      { code: "ak", label: "Twi" },
    ],
    locale: "en-GH",
    timezone: "Africa/Accra",
    mapCenter: { lat: 5.6037, lng: -0.187 },
    payments: ["cash", "mtn_momo", "paystack"],
    pricing: pricingFromMin("GHS", 20, 7),
  }),
  TZ: country({
    code: "TZ",
    name: "Tanzania",
    flag: "🇹🇿",
    currency: "TZS",
    currencySymbol: "TSh",
    phonePrefix: "255",
    phoneLocalDigits: 9,
    language: "sw",
    languageLabel: "Swahili",
    languages: [
      { code: "en", label: "English" },
      { code: "sw", label: "Swahili" },
    ],
    locale: "en-TZ",
    timezone: "Africa/Dar_es_Salaam",
    mapCenter: { lat: -6.7924, lng: 39.2083 },
    payments: ["cash", "mpesa"],
    localRideModes: [{ id: "boda", label: "Boda (motorcycle)" }],
    pricing: pricingFromMin("TZS", 5000, 1500),
  }),
  KZ: country({
    code: "KZ",
    name: "Kazakhstan",
    flag: "🇰🇿",
    currency: "KZT",
    currencySymbol: "₸",
    phonePrefix: "7",
    phoneLocalDigits: 10,
    language: "kk",
    languageLabel: "Kazakh",
    languages: [
      { code: "en", label: "English" },
      { code: "kk", label: "Kazakh" },
      { code: "ru", label: "Russian" },
    ],
    locale: "ru-KZ",
    timezone: "Asia/Almaty",
    mapCenter: { lat: 43.222, lng: 76.8512 },
    payments: ["cash", "kaspi"],
    pricing: pricingFromMin("KZT", 800, 200),
  }),
  NA: country({
    code: "NA",
    name: "Namibia",
    flag: "🇳🇦",
    currency: "NAD",
    currencySymbol: "N$",
    phonePrefix: "264",
    phoneLocalDigits: 9,
    language: "en",
    languageLabel: "English",
    languages: [{ code: "en", label: "English" }],
    locale: "en-NA",
    timezone: "Africa/Windhoek",
    mapCenter: { lat: -22.5609, lng: 17.0658 },
    payments: ["cash"],
    pricing: pricingFromMin("NAD", 30, 10),
  }),
  BW: country({
    code: "BW",
    name: "Botswana",
    flag: "🇧🇼",
    currency: "BWP",
    currencySymbol: "P",
    phonePrefix: "267",
    phoneLocalDigits: 8,
    language: "en",
    languageLabel: "English",
    languages: [{ code: "en", label: "English" }],
    locale: "en-BW",
    timezone: "Africa/Gaborone",
    mapCenter: { lat: -24.6282, lng: 25.9231 },
    payments: ["cash"],
    pricing: pricingFromMin("BWP", 25, 8),
  }),
  EG: country({
    code: "EG",
    name: "Egypt",
    flag: "🇪🇬",
    currency: "EGP",
    currencySymbol: "E£",
    phonePrefix: "20",
    phoneLocalDigits: 10,
    language: "ar",
    languageLabel: "Arabic",
    languages: [
      { code: "en", label: "English" },
      { code: "ar", label: "Arabic" },
    ],
    locale: "ar-EG",
    timezone: "Africa/Cairo",
    mapCenter: { lat: 30.0444, lng: 31.2357 },
    payments: ["cash"],
    pricing: pricingFromMin("EGP", 100, 30),
  }),
  PK: country({
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰",
    currency: "PKR",
    currencySymbol: "₨",
    phonePrefix: "92",
    phoneLocalDigits: 10,
    language: "ur",
    languageLabel: "Urdu",
    languages: [
      { code: "en", label: "English" },
      { code: "ur", label: "Urdu" },
    ],
    locale: "en-PK",
    timezone: "Asia/Karachi",
    mapCenter: { lat: 31.5204, lng: 74.3587 },
    payments: ["cash", "bank_transfer"],
    pricing: pricingFromMin("PKR", 500, 150),
  }),
  BR: country({
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    currency: "BRL",
    currencySymbol: "R$",
    phonePrefix: "55",
    phoneLocalDigits: 11,
    language: "pt",
    languageLabel: "Português",
    languages: [
      { code: "en", label: "English" },
      { code: "pt", label: "Português" },
    ],
    locale: "pt-BR",
    timezone: "America/Sao_Paulo",
    mapCenter: { lat: -23.5505, lng: -46.6333 },
    payments: ["cash", "pix"],
    pricing: pricingFromMin("BRL", 15, 5),
  }),
  IN: country({
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    currency: "INR",
    currencySymbol: "₹",
    phonePrefix: "91",
    phoneLocalDigits: 10,
    language: "hi",
    languageLabel: "Hindi",
    languages: [
      { code: "en", label: "English" },
      { code: "hi", label: "Hindi" },
      { code: "ta", label: "Tamil" },
      { code: "te", label: "Telugu" },
    ],
    locale: "en-IN",
    timezone: "Asia/Kolkata",
    mapCenter: { lat: 28.6139, lng: 77.209 },
    payments: ["cash", "upi"],
    localRideModes: [{ id: "auto", label: "Auto (rickshaw)" }],
    pricing: pricingFromMin("INR", 100, 30),
  }),
  PH: country({
    code: "PH",
    name: "Philippines",
    flag: "🇵🇭",
    currency: "PHP",
    currencySymbol: "₱",
    phonePrefix: "63",
    phoneLocalDigits: 10,
    language: "tl",
    languageLabel: "Filipino",
    languages: [
      { code: "en", label: "English" },
      { code: "tl", label: "Tagalog" },
    ],
    locale: "en-PH",
    timezone: "Asia/Manila",
    mapCenter: { lat: 14.5995, lng: 120.9842 },
    payments: ["cash", "gcash"],
    localRideModes: [{ id: "tricycle", label: "Tricycle" }],
    pricing: pricingFromMin("PHP", 100, 30),
  }),
  MX: country({
    code: "MX",
    name: "Mexico",
    flag: "🇲🇽",
    currency: "MXN",
    currencySymbol: "$",
    phonePrefix: "52",
    phoneLocalDigits: 10,
    language: "es",
    languageLabel: "Español",
    languages: [
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
    ],
    locale: "es-MX",
    timezone: "America/Mexico_City",
    mapCenter: { lat: 19.4326, lng: -99.1332 },
    payments: ["cash"],
    pricing: pricingFromMin("MXN", 80, 25),
  }),
  ID: country({
    code: "ID",
    name: "Indonesia",
    flag: "🇮🇩",
    currency: "IDR",
    currencySymbol: "Rp",
    phonePrefix: "62",
    phoneLocalDigits: 11,
    language: "id",
    languageLabel: "Bahasa Indonesia",
    languages: [
      { code: "en", label: "English" },
      { code: "id", label: "Bahasa Indonesia" },
    ],
    locale: "id-ID",
    timezone: "Asia/Jakarta",
    mapCenter: { lat: -6.2088, lng: 106.8456 },
    payments: ["cash", "gopay", "ovo"],
    pricing: pricingFromMin("IDR", 15000, 5000),
  }),
  VN: country({
    code: "VN",
    name: "Vietnam",
    flag: "🇻🇳",
    currency: "VND",
    currencySymbol: "₫",
    phonePrefix: "84",
    phoneLocalDigits: 9,
    language: "vi",
    languageLabel: "Tiếng Việt",
    languages: [
      { code: "en", label: "English" },
      { code: "vi", label: "Tiếng Việt" },
    ],
    locale: "vi-VN",
    timezone: "Asia/Ho_Chi_Minh",
    mapCenter: { lat: 21.0278, lng: 105.8342 },
    payments: ["cash", "momo_vn"],
    pricing: pricingFromMin("VND", 50000, 15000),
  }),
  TH: country({
    code: "TH",
    name: "Thailand",
    flag: "🇹🇭",
    currency: "THB",
    currencySymbol: "฿",
    phonePrefix: "66",
    phoneLocalDigits: 9,
    language: "th",
    languageLabel: "ไทย",
    languages: [
      { code: "en", label: "English" },
      { code: "th", label: "ไทย" },
    ],
    locale: "th-TH",
    timezone: "Asia/Bangkok",
    mapCenter: { lat: 13.7563, lng: 100.5018 },
    payments: ["cash", "promptpay"],
    localRideModes: [{ id: "tuktuk", label: "Tuk Tuk" }],
    pricing: pricingFromMin("THB", 60, 20),
  }),
  CO: country({
    code: "CO",
    name: "Colombia",
    flag: "🇨🇴",
    currency: "COP",
    currencySymbol: "$",
    phonePrefix: "57",
    phoneLocalDigits: 10,
    language: "es",
    languageLabel: "Español",
    languages: [
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
    ],
    locale: "es-CO",
    timezone: "America/Bogota",
    mapCenter: { lat: 4.711, lng: -74.0721 },
    payments: ["cash"],
    pricing: pricingFromMin("COP", 8000, 2500),
  }),
  PE: country({
    code: "PE",
    name: "Peru",
    flag: "🇵🇪",
    currency: "PEN",
    currencySymbol: "S/",
    phonePrefix: "51",
    phoneLocalDigits: 9,
    language: "es",
    languageLabel: "Español",
    languages: [
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
    ],
    locale: "es-PE",
    timezone: "America/Lima",
    mapCenter: { lat: -12.0464, lng: -77.0428 },
    payments: ["cash"],
    pricing: pricingFromMin("PEN", 15, 5),
  }),
  UZ: country({
    code: "UZ",
    name: "Uzbekistan",
    flag: "🇺🇿",
    currency: "UZS",
    currencySymbol: "so'm",
    phonePrefix: "998",
    phoneLocalDigits: 9,
    language: "uz",
    languageLabel: "Oʻzbek",
    languages: [
      { code: "en", label: "English" },
      { code: "uz", label: "Oʻzbek" },
      { code: "ru", label: "Russian" },
    ],
    locale: "uz-UZ",
    timezone: "Asia/Tashkent",
    mapCenter: { lat: 41.2995, lng: 69.2401 },
    payments: ["cash"],
    pricing: pricingFromMin("UZS", 8000, 2500),
  }),
  KG: country({
    code: "KG",
    name: "Kyrgyzstan",
    flag: "🇰🇬",
    currency: "KGS",
    currencySymbol: "som",
    phonePrefix: "996",
    phoneLocalDigits: 9,
    language: "ky",
    languageLabel: "Кыргызча",
    languages: [
      { code: "en", label: "English" },
      { code: "ky", label: "Кыргызча" },
      { code: "ru", label: "Russian" },
    ],
    locale: "ky-KG",
    timezone: "Asia/Bishkek",
    mapCenter: { lat: 42.8746, lng: 74.5698 },
    payments: ["cash"],
    pricing: pricingFromMin("KGS", 150, 50),
  }),
  MN: country({
    code: "MN",
    name: "Mongolia",
    flag: "🇲🇳",
    currency: "MNT",
    currencySymbol: "₮",
    phonePrefix: "976",
    phoneLocalDigits: 8,
    language: "mn",
    languageLabel: "Монгол",
    languages: [
      { code: "en", label: "English" },
      { code: "mn", label: "Монгол" },
    ],
    locale: "mn-MN",
    timezone: "Asia/Ulaanbaatar",
    mapCenter: { lat: 47.8864, lng: 106.9057 },
    payments: ["cash"],
    pricing: pricingFromMin("MNT", 3000, 1000),
  }),
};

export function isCountryCode(value: unknown): value is CountryCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(COUNTRIES, value)
  );
}

export function getCountry(code?: string | null): CountryConfig {
  if (code && isCountryBlocked(code)) {
    return COUNTRIES[DEFAULT_COUNTRY];
  }
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
    case "mtn_momo":
      return "MTN MoMo";
    case "bank_transfer":
      return "Bank Transfer";
    case "kaspi":
      return "Kaspi.kz";
    case "pix":
      return "Pix";
    case "upi":
      return "UPI";
    case "gcash":
      return "GCash";
    case "gopay":
      return "GoPay";
    case "ovo":
      return "OVO";
    case "momo_vn":
      return "MoMo";
    case "promptpay":
      return "PromptPay";
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
    case "mtn_momo":
      return "MTN MoMo checkout coming soon — cash works today.";
    case "bank_transfer":
      return "Bank transfer details shared after booking — or pay cash.";
    case "kaspi":
      return "Kaspi.kz checkout coming soon — cash works today.";
    case "pix":
      return "Pix checkout coming soon — cash works today.";
    case "upi":
      return "UPI checkout coming soon — cash works today.";
    case "gcash":
      return "GCash checkout coming soon — cash works today.";
    case "gopay":
      return "GoPay checkout coming soon — cash works today.";
    case "ovo":
      return "OVO checkout coming soon — cash works today.";
    case "momo_vn":
      return "MoMo checkout coming soon — cash works today.";
    case "promptpay":
      return "PromptPay checkout coming soon — cash works today.";
  }
}

export const AVAILABLE_IN_FLAGS = enabledCountries()
  .map((c) => c.flag)
  .join(" ");

export const GLOBAL_COUNTRY_COUNT = enabledCountries().length;

/** Explicit allow-list — must match CountryCode keys above. */
export const SUPPORTED_COUNTRIES: readonly CountryCode[] = [
  "ZA",
  "KE",
  "NG",
  "GH",
  "TZ",
  "KZ",
  "NA",
  "BW",
  "EG",
  "PK",
  "BR",
  "IN",
  "PH",
  "MX",
  "ID",
  "VN",
  "TH",
  "CO",
  "PE",
  "UZ",
  "KG",
  "MN",
];

/** Developed markets we deliberately do not serve (yet). */
export const BLOCKED_COUNTRIES = [
  "US",
  "GB",
  "UK",
  "CA",
  "AU",
  "NZ",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "BE",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "AT",
  "CH",
  "GR",
  "PT",
  "PL",
  "CZ",
  "HU",
] as const;

export const MARKET_REGIONS_LABEL = "Africa, Asia, and Latin America";

export const UNSUPPORTED_MARKET_MESSAGE = `Village Ride is currently available in ${GLOBAL_COUNTRY_COUNT} countries across ${MARKET_REGIONS_LABEL}. We're not yet in the US, UK, or other developed city markets — we build for villages. Stay tuned for future expansion.`;

export function isCountrySupported(countryCode: string): boolean {
  return (SUPPORTED_COUNTRIES as readonly string[]).includes(
    countryCode.toUpperCase(),
  );
}

export function isCountryBlocked(countryCode: string): boolean {
  return (BLOCKED_COUNTRIES as readonly string[]).includes(
    countryCode.toUpperCase(),
  );
}

/** Timezones that strongly suggest a blocked developed market (soft notice only). */
const DEVELOPED_TZ_PREFIXES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Rome",
  "Europe/Madrid",
  "Australia/",
  "Pacific/Auckland",
] as const;

export function looksLikeUnsupportedMarketTimezone(
  timeZone?: string | null,
): boolean {
  if (!timeZone) return false;
  return DEVELOPED_TZ_PREFIXES.some(
    (p) => timeZone === p || timeZone.startsWith(p),
  );
}
