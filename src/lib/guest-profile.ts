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
  /** Compressed data URL for instant UI / mock bookings (optional). */
  photo_data_url?: string | null;
  /** Supabase Storage path in rider-photos bucket (optional). */
  photo_url?: string | null;
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
    const photo_data_url =
      typeof parsed.photo_data_url === "string" &&
      parsed.photo_data_url.startsWith("data:image/")
        ? parsed.photo_data_url
        : null;
    const photo_url =
      typeof parsed.photo_url === "string" && parsed.photo_url.trim()
        ? parsed.photo_url.trim()
        : null;
    return {
      name: String(parsed.name ?? "").trim(),
      phone: normalizeGuestPhone(String(parsed.phone), country_code),
      country_code,
      photo_data_url,
      photo_url,
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
  const existing = getGuestProfile();
  const next: GuestProfile = {
    name: profile.name.trim(),
    phone: normalizeGuestPhone(profile.phone, country_code),
    country_code,
    photo_data_url:
      profile.photo_data_url !== undefined
        ? profile.photo_data_url
        : existing?.photo_data_url ?? null,
    photo_url:
      profile.photo_url !== undefined
        ? profile.photo_url
        : existing?.photo_url ?? null,
  };
  if (!next.phone) return;
  localStorage.setItem(KEY, JSON.stringify(next));
  setStoredCountryCode(country_code);
}

/** Update or clear rider face photo on the guest profile (keeps name/phone). */
export function setGuestRiderPhoto(opts: {
  photo_data_url?: string | null;
  photo_url?: string | null;
}): GuestProfile | null {
  const current = getGuestProfile();
  if (!current?.phone) return null;
  setGuestProfile({
    ...current,
    photo_data_url:
      opts.photo_data_url !== undefined
        ? opts.photo_data_url
        : current.photo_data_url,
    photo_url:
      opts.photo_url !== undefined ? opts.photo_url : current.photo_url,
  });
  return getGuestProfile();
}

export function clearGuestRiderPhoto(): GuestProfile | null {
  return setGuestRiderPhoto({ photo_data_url: null, photo_url: null });
}

export function clearGuestProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export { DEFAULT_COUNTRY };
