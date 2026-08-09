/**
 * Multi-country Village Ride config — global rural logistics.
 * Every country in WORLD_COUNTRY_SEEDS is enabled. Featured markets keep
 * richer local languages, payments, and ride modes.
 */

import { WORLD_COUNTRY_SEEDS } from "./world-countries-data";

export type CountryCode = string;

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
  | "ky"
  | "fr"
  | "de"
  | "zh"
  | "ja"
  | "ko";

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
  language: AppLocale;
  languageLabel: string;
  languages: LanguageOption[];
  locale: string;
  timezone: string;
  mapCenter: { lat: number; lng: number };
  payments: PaymentMethodId[];
  landmarkHints: readonly string[];
  pricing: CountryPricing;
  localRideModes: LocalRideMode[];
  enabled: boolean;
};

export const DEFAULT_COUNTRY: CountryCode = "ZA";

/** Markets the app actually operates in — never show the full world list in pickers. */
export const OPERATING_COUNTRY_CODES = ["ZA", "NG", "KE"] as const;

export function isOperatingCountry(code: string | null | undefined): boolean {
  return (
    typeof code === "string" &&
    (OPERATING_COUNTRY_CODES as readonly string[]).includes(code)
  );
}

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
    commissionPct: 10,
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

/** Rough fare floors by currency so new markets get usable quotes. */
function defaultFareForCurrency(currency: string): { min: number; perKm: number } {
  switch (currency) {
    case "USD":
    case "CAD":
    case "AUD":
    case "NZD":
    case "SGD":
    case "CHF":
      return { min: 5, perKm: 1.5 };
    case "EUR":
    case "GBP":
      return { min: 4, perKm: 1.2 };
    case "JPY":
    case "KRW":
      return { min: 800, perKm: 200 };
    case "CNY":
    case "HKD":
    case "TWD":
      return { min: 20, perKm: 6 };
    case "INR":
    case "PKR":
    case "BDT":
    case "LKR":
    case "NPR":
      return { min: 100, perKm: 30 };
    case "IDR":
    case "VND":
    case "UZS":
    case "LAK":
    case "KHR":
      return { min: 20000, perKm: 5000 };
    case "NGN":
      return { min: 1500, perKm: 500 };
    case "KES":
    case "UGX":
    case "TZS":
      return { min: 300, perKm: 100 };
    case "ZAR":
    case "NAD":
    case "BWP":
    case "LSL":
    case "SZL":
      return { min: 30, perKm: 10 };
    case "GHS":
      return { min: 20, perKm: 7 };
    case "XOF":
    case "XAF":
      return { min: 1500, perKm: 400 };
    case "BRL":
    case "PEN":
    case "MXN":
    case "CLP":
    case "COP":
    case "ARS":
      return { min: 20, perKm: 6 };
    case "AED":
    case "SAR":
    case "QAR":
    case "KWD":
    case "OMR":
    case "BHD":
      return { min: 15, perKm: 4 };
    case "TRY":
    case "EGP":
    case "MAD":
    case "TND":
      return { min: 50, perKm: 15 };
    case "RUB":
    case "UAH":
    case "KZT":
    case "KGS":
      return { min: 300, perKm: 80 };
    case "THB":
    case "MYR":
    case "PHP":
      return { min: 60, perKm: 20 };
    case "PLN":
    case "CZK":
    case "HUF":
    case "RON":
      return { min: 20, perKm: 6 };
    case "SEK":
    case "NOK":
    case "DKK":
    case "ISK":
      return { min: 50, perKm: 15 };
    default:
      return { min: 10, perKm: 3 };
  }
}

type FeaturedOverride = Partial<
  Pick<
    CountryConfig,
    | "language"
    | "languageLabel"
    | "languages"
    | "locale"
    | "timezone"
    | "payments"
    | "localRideModes"
    | "pricing"
  >
> & { fareMin?: number; farePerKm?: number };

/** Richer config for priority / launch markets. */
const FEATURED: Record<string, FeaturedOverride> = {
  ZA: {
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
    payments: ["cash", "paypal", "eft", "card"],
    // Village Ride ZA: R15 base + R10/km (+ R5 booking fee unless Village Pass)
    fareMin: 15,
    farePerKm: 10,
  },
  KE: {
    language: "sw",
    languageLabel: "Swahili",
    languages: [
      { code: "en", label: "English" },
      { code: "sw", label: "Swahili" },
    ],
    locale: "en-KE",
    timezone: "Africa/Nairobi",
    payments: ["cash", "mpesa", "card"],
    localRideModes: [{ id: "boda", label: "Boda (motorcycle)" }],
    fareMin: 300,
    farePerKm: 100,
  },
  NG: {
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
    payments: ["cash", "bank_transfer", "paystack", "card"],
    localRideModes: [{ id: "okada", label: "Okada (motorcycle)" }],
    fareMin: 1500,
    farePerKm: 500,
  },
  GH: {
    language: "ak",
    languageLabel: "Twi",
    languages: [
      { code: "en", label: "English" },
      { code: "ak", label: "Twi" },
    ],
    locale: "en-GH",
    timezone: "Africa/Accra",
    payments: ["cash", "mtn_momo", "paystack", "card"],
    fareMin: 20,
    farePerKm: 7,
  },
  TZ: {
    language: "sw",
    languageLabel: "Swahili",
    languages: [
      { code: "en", label: "English" },
      { code: "sw", label: "Swahili" },
    ],
    locale: "en-TZ",
    timezone: "Africa/Dar_es_Salaam",
    payments: ["cash", "mpesa", "card"],
    localRideModes: [{ id: "boda", label: "Boda (motorcycle)" }],
    fareMin: 5000,
    farePerKm: 1500,
  },
  KZ: {
    language: "kk",
    languageLabel: "Kazakh",
    languages: [
      { code: "en", label: "English" },
      { code: "kk", label: "Kazakh" },
      { code: "ru", label: "Russian" },
    ],
    locale: "ru-KZ",
    timezone: "Asia/Almaty",
    payments: ["cash", "kaspi", "card"],
    fareMin: 800,
    farePerKm: 200,
  },
  NA: {
    payments: ["cash", "card"],
    fareMin: 30,
    farePerKm: 10,
  },
  BW: {
    payments: ["cash", "card"],
    fareMin: 25,
    farePerKm: 8,
  },
  EG: {
    language: "ar",
    languageLabel: "Arabic",
    languages: [
      { code: "en", label: "English" },
      { code: "ar", label: "Arabic" },
    ],
    locale: "ar-EG",
    timezone: "Africa/Cairo",
    payments: ["cash", "card"],
    fareMin: 100,
    farePerKm: 30,
  },
  PK: {
    language: "ur",
    languageLabel: "Urdu",
    languages: [
      { code: "en", label: "English" },
      { code: "ur", label: "Urdu" },
    ],
    locale: "en-PK",
    timezone: "Asia/Karachi",
    payments: ["cash", "bank_transfer", "card"],
    fareMin: 500,
    farePerKm: 150,
  },
  BR: {
    language: "pt",
    languageLabel: "Português",
    languages: [
      { code: "en", label: "English" },
      { code: "pt", label: "Português" },
    ],
    locale: "pt-BR",
    timezone: "America/Sao_Paulo",
    payments: ["cash", "pix", "card"],
    fareMin: 15,
    farePerKm: 5,
  },
  IN: {
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
    payments: ["cash", "upi", "card"],
    localRideModes: [{ id: "auto", label: "Auto (rickshaw)" }],
    fareMin: 100,
    farePerKm: 30,
  },
  PH: {
    language: "tl",
    languageLabel: "Filipino",
    languages: [
      { code: "en", label: "English" },
      { code: "tl", label: "Tagalog" },
    ],
    locale: "en-PH",
    timezone: "Asia/Manila",
    payments: ["cash", "gcash", "card"],
    localRideModes: [{ id: "tricycle", label: "Tricycle" }],
    fareMin: 100,
    farePerKm: 30,
  },
  MX: {
    language: "es",
    languageLabel: "Español",
    languages: [
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
    ],
    locale: "es-MX",
    timezone: "America/Mexico_City",
    payments: ["cash", "card"],
    fareMin: 80,
    farePerKm: 25,
  },
  ID: {
    language: "id",
    languageLabel: "Bahasa Indonesia",
    languages: [
      { code: "en", label: "English" },
      { code: "id", label: "Bahasa Indonesia" },
    ],
    locale: "id-ID",
    timezone: "Asia/Jakarta",
    payments: ["cash", "gopay", "ovo", "card"],
    fareMin: 15000,
    farePerKm: 5000,
  },
  VN: {
    language: "vi",
    languageLabel: "Tiếng Việt",
    languages: [
      { code: "en", label: "English" },
      { code: "vi", label: "Tiếng Việt" },
    ],
    locale: "vi-VN",
    timezone: "Asia/Ho_Chi_Minh",
    payments: ["cash", "momo_vn", "card"],
    fareMin: 50000,
    farePerKm: 15000,
  },
  TH: {
    language: "th",
    languageLabel: "ไทย",
    languages: [
      { code: "en", label: "English" },
      { code: "th", label: "ไทย" },
    ],
    locale: "th-TH",
    timezone: "Asia/Bangkok",
    payments: ["cash", "promptpay", "card"],
    localRideModes: [{ id: "tuktuk", label: "Tuk Tuk" }],
    fareMin: 60,
    farePerKm: 20,
  },
  CO: {
    language: "es",
    languageLabel: "Español",
    languages: [
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
    ],
    locale: "es-CO",
    timezone: "America/Bogota",
    payments: ["cash", "card"],
    fareMin: 8000,
    farePerKm: 2500,
  },
  PE: {
    language: "es",
    languageLabel: "Español",
    languages: [
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
    ],
    locale: "es-PE",
    timezone: "America/Lima",
    payments: ["cash", "card"],
    fareMin: 15,
    farePerKm: 5,
  },
  UZ: {
    language: "uz",
    languageLabel: "Oʻzbek",
    languages: [
      { code: "en", label: "English" },
      { code: "uz", label: "Oʻzbek" },
      { code: "ru", label: "Russian" },
    ],
    locale: "uz-UZ",
    timezone: "Asia/Tashkent",
    payments: ["cash", "card"],
    fareMin: 8000,
    farePerKm: 2500,
  },
  KG: {
    language: "ky",
    languageLabel: "Кыргызча",
    languages: [
      { code: "en", label: "English" },
      { code: "ky", label: "Кыргызча" },
      { code: "ru", label: "Russian" },
    ],
    locale: "ky-KG",
    timezone: "Asia/Bishkek",
    payments: ["cash", "card"],
    fareMin: 150,
    farePerKm: 50,
  },
  MN: {
    language: "mn",
    languageLabel: "Монгол",
    languages: [
      { code: "en", label: "English" },
      { code: "mn", label: "Монгол" },
    ],
    locale: "mn-MN",
    timezone: "Asia/Ulaanbaatar",
    payments: ["cash", "card"],
    fareMin: 3000,
    farePerKm: 1000,
  },
  US: {
    locale: "en-US",
    timezone: "America/New_York",
    payments: ["cash", "card", "paypal"],
    fareMin: 8,
    farePerKm: 2,
  },
  GB: {
    locale: "en-GB",
    timezone: "Europe/London",
    payments: ["cash", "card", "paypal"],
    fareMin: 6,
    farePerKm: 1.8,
  },
  CA: {
    locale: "en-CA",
    timezone: "America/Toronto",
    payments: ["cash", "card", "paypal"],
    fareMin: 8,
    farePerKm: 2,
  },
  AU: {
    locale: "en-AU",
    timezone: "Australia/Sydney",
    payments: ["cash", "card", "paypal"],
    fareMin: 8,
    farePerKm: 2,
  },
};

function buildCountry(seed: (typeof WORLD_COUNTRY_SEEDS)[number]): CountryConfig {
  const featured = FEATURED[seed.code] ?? {};
  const fare =
    featured.fareMin != null && featured.farePerKm != null
      ? { min: featured.fareMin, perKm: featured.farePerKm }
      : defaultFareForCurrency(seed.currency);

  return {
    code: seed.code,
    name: seed.name,
    flag: seed.flag,
    currency: seed.currency,
    currencySymbol: seed.currencySymbol,
    phonePrefix: seed.phonePrefix,
    phoneLocalDigits: seed.phoneLocalDigits,
    language: featured.language ?? "en",
    languageLabel: featured.languageLabel ?? "English",
    languages: featured.languages ?? [{ code: "en", label: "English" }],
    locale: featured.locale ?? `en-${seed.code}`,
    timezone: featured.timezone ?? "UTC",
    mapCenter: seed.mapCenter,
    payments: featured.payments ?? ["cash", "card"],
    landmarkHints: RURAL_HINTS,
    pricing:
      featured.pricing ??
      pricingFromMin(seed.currency, fare.min, fare.perKm),
    localRideModes: featured.localRideModes ?? [],
    enabled: true,
  };
}

export const COUNTRIES: Record<string, CountryConfig> = Object.fromEntries(
  WORLD_COUNTRY_SEEDS.map((seed) => [seed.code, buildCountry(seed)]),
);

export function isCountryCode(value: unknown): value is CountryCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(COUNTRIES, value)
  );
}

export function getCountry(code?: string | null): CountryConfig {
  if (isCountryCode(code) && COUNTRIES[code]?.enabled) {
    return COUNTRIES[code];
  }
  return COUNTRIES[DEFAULT_COUNTRY];
}

export function enabledCountries(): CountryConfig[] {
  const featured = new Set(FEATURED_COUNTRY_CODES);
  return Object.values(COUNTRIES)
    .filter((c) => c.enabled)
    .sort((a, b) => {
      const af = featured.has(a.code) ? 0 : 1;
      const bf = featured.has(b.code) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.name.localeCompare(b.name);
    });
}

/** App pickers only — ZA, NG, KE. */
export function operatingCountries(): CountryConfig[] {
  return OPERATING_COUNTRY_CODES.map((code) => COUNTRIES[code]).filter(
    Boolean,
  );
}

/** Featured launch markets (shown first in some UIs). */
export const FEATURED_COUNTRY_CODES = Object.keys(FEATURED);

export function featuredCountries(): CountryConfig[] {
  return FEATURED_COUNTRY_CODES.map((code) => COUNTRIES[code]).filter(Boolean);
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
      return "Card payment — available where enabled.";
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

export const AVAILABLE_IN_FLAGS = featuredCountries()
  .map((c) => c.flag)
  .join(" ");

export const GLOBAL_COUNTRY_COUNT = enabledCountries().length;

/** All countries are supported — global rural logistics. */
export const SUPPORTED_COUNTRIES: readonly string[] = WORLD_COUNTRY_SEEDS.map(
  (c) => c.code,
);

/** @deprecated No blocked markets — kept empty for compatibility. */
export const BLOCKED_COUNTRIES: readonly string[] = [];

export const MARKET_REGIONS_LABEL = "every continent";

export const UNSUPPORTED_MARKET_MESSAGE =
  "Village Ride operates in South Africa, Nigeria, and Kenya. Pay your driver in cash. Built for villages, towns, and cities.";

export function isCountrySupported(countryCode: string): boolean {
  return isCountryCode(countryCode.toUpperCase());
}

export function isCountryBlocked(_countryCode: string): boolean {
  return false;
}

export function looksLikeUnsupportedMarketTimezone(
  _timeZone?: string | null,
): boolean {
  return false;
}
