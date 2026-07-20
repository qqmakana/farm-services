import {
  getCountry,
  type CountryCode,
} from "./countries";

/** Digits-only national form when possible (leading 0 for ZA-style). */
export function normalizePhoneForCountry(
  phone: string,
  countryCode?: string | null,
): string {
  const c = getCountry(countryCode);
  const digits = phone.replace(/\D/g, "");
  const prefix = c.phonePrefix;

  if (digits.startsWith(prefix) && digits.length >= prefix.length + 7) {
    const local = digits.slice(prefix.length);
    // Prefer leading 0 for ZA/KE/NG/GH/PH style; India often without.
    if (c.code === "IN") return local.slice(0, c.phoneLocalDigits);
    return `0${local.slice(0, c.phoneLocalDigits)}`;
  }

  if (digits.startsWith("0")) {
    return digits.slice(0, c.phoneLocalDigits + 1);
  }

  if (c.code === "IN" && digits.length >= 10) {
    return digits.slice(0, 10);
  }

  return digits;
}

export function phoneMatchVariantsForCountry(
  phone: string,
  countryCode?: string | null,
): string[] {
  const c = getCountry(countryCode);
  const n = normalizePhoneForCountry(phone, c.code);
  if (!n) return [];
  const local = n.startsWith("0") ? n.slice(1) : n;
  return [
    ...new Set(
      [n, phone.trim(), `${c.phonePrefix}${local}`, `+${c.phonePrefix}${local}`, `0${local}`].filter(
        Boolean,
      ),
    ),
  ];
}

/** Soft validation — accepts common mobile formats per country. */
export function isValidMobileForCountry(
  phone: string,
  countryCode?: string | null,
): boolean {
  const c = getCountry(countryCode);
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith(c.phonePrefix)) {
    const local = digits.slice(c.phonePrefix.length);
    return local.length >= c.phoneLocalDigits - 1 && local.length <= c.phoneLocalDigits + 1;
  }

  if (digits.startsWith("0")) {
    return digits.length >= c.phoneLocalDigits && digits.length <= c.phoneLocalDigits + 1;
  }

  // India / bare national
  if (c.code === "IN") {
    return /^[6-9]\d{9}$/.test(digits);
  }

  return digits.length >= c.phoneLocalDigits - 1 && digits.length <= c.phoneLocalDigits + 1;
}

/** @deprecated use isValidMobileForCountry — kept for SA-only call sites. */
export function isSouthAfricanMobileCompat(phone: string): boolean {
  return isValidMobileForCountry(phone, "ZA" satisfies CountryCode);
}
