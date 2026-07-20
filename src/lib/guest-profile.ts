/** Frictionless guest profile — name + phone + country in localStorage. */

import { DEFAULT_COUNTRY, isCountryCode, type CountryCode } from "./countries";
import {
  getStoredCountryCode,
  setStoredCountryCode,
} from "./country-preference";
import {
  normalizePhoneForCountry,
  phoneMatchVariantsForCountry,
} from "./phone";

export type GuestProfile = {
  name: string;
  phone: string;
  country_code: CountryCode;
};

const KEY = "village_ride_guest_profile";

/** Digits-only national form for the guest's country. */
export function normalizeGuestPhone(
  phone: string,
  countryCode?: string | null,
): string {
  return normalizePhoneForCountry(
    phone,
    countryCode ?? getStoredCountryCode(),
  );
}

/** Match variants for job lookup. */
export function phoneMatchVariants(
  phone: string,
  countryCode?: string | null,
): string[] {
  return phoneMatchVariantsForCountry(
    phone,
    countryCode ?? getStoredCountryCode(),
  );
}

export function getGuestProfile(): GuestProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestProfile>;
    if (!parsed?.phone) return null;
    const country_code = isCountryCode(parsed.country_code)
      ? parsed.country_code
      : getStoredCountryCode();
    return {
      name: String(parsed.name ?? "").trim(),
      phone: normalizeGuestPhone(String(parsed.phone), country_code),
      country_code,
    };
  } catch {
    return null;
  }
}

export function setGuestProfile(
  profile: Omit<GuestProfile, "country_code"> & {
    country_code?: CountryCode;
  },
): void {
  if (typeof window === "undefined") return;
  const country_code = profile.country_code ?? getStoredCountryCode();
  const next: GuestProfile = {
    name: profile.name.trim(),
    phone: normalizeGuestPhone(profile.phone, country_code),
    country_code,
  };
  if (!next.phone) return;
  localStorage.setItem(KEY, JSON.stringify(next));
  setStoredCountryCode(country_code);
}

export function clearGuestProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export { DEFAULT_COUNTRY };
