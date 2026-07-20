/**
 * Country preference — localStorage for guests; sync to profile when logged in.
 */

import {
  DEFAULT_COUNTRY,
  getCountry,
  isCountryCode,
  type AppLocale,
  type CountryCode,
} from "./countries";

const COUNTRY_KEY = "village_ride_country";
const LOCALE_KEY = "village_ride_locale";
const PICKED_KEY = "village_ride_country_picked";

export function getStoredCountryCode(): CountryCode {
  if (typeof window === "undefined") return DEFAULT_COUNTRY;
  try {
    const raw = localStorage.getItem(COUNTRY_KEY);
    if (isCountryCode(raw) && getCountry(raw).enabled) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_COUNTRY;
}

export function setStoredCountryCode(code: CountryCode): void {
  if (typeof window === "undefined") return;
  if (!getCountry(code).enabled) return;
  localStorage.setItem(COUNTRY_KEY, code);
  localStorage.setItem(PICKED_KEY, "1");
}

export function hasPickedCountry(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(PICKED_KEY) === "1";
  } catch {
    return true;
  }
}

export function getStoredLocale(): AppLocale | "en" {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (raw === "en") return "en";
    const country = getCountry(getStoredCountryCode());
    if (raw === country.language) return country.language;
  } catch {
    /* ignore */
  }
  return "en";
}

export function setStoredLocale(locale: AppLocale | "en"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_KEY, locale);
}

export function formatPhonePlaceholder(countryCode?: string | null): string {
  const c = getCountry(countryCode);
  switch (c.code) {
    case "ZA":
      return "063 621 3590";
    case "KE":
      return "0712 345 678";
    case "NG":
      return "0803 123 4567";
    case "GH":
      return "024 123 4567";
    case "IN":
      return "98765 43210";
    case "PH":
      return "0917 123 4567";
    default:
      return c.phonePrefix;
  }
}
