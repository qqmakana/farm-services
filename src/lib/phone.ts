import {
  getCountry,
  type CountryCode,
} from "./countries";

/** Countries that store national mobiles with a leading trunk 0 (e.g. 082…). */
function usesLeadingZero(code: string): boolean {
  return ![
    "US",
    "CA",
    "GB",
    "AU",
    "NZ",
    "IE",
    "IN",
    "MX",
    "BR",
    "AR",
    "CL",
    "CO",
    "PE",
  ].includes(code);
}

/** Digits-only national form when possible. */
export function normalizePhoneForCountry(
  phone: string,
  countryCode?: string | null,
): string {
  const c = getCountry(countryCode);
  const digits = phone.replace(/\D/g, "");
  const prefix = c.phonePrefix;
  const maxLocal = c.phoneLocalDigits;

  if (digits.startsWith(prefix) && digits.length >= prefix.length + 7) {
    const local = digits.slice(prefix.length).slice(0, maxLocal);
    if (usesLeadingZero(c.code) && !local.startsWith("0")) {
      return `0${local}`.slice(0, maxLocal + 1);
    }
    return local;
  }

  if (digits.startsWith("0")) {
    return digits.slice(0, maxLocal + 1);
  }

  if (c.code === "IN" && digits.length >= 10) {
    return digits.slice(0, 10);
  }

  // NANP / bare national — do not invent a leading 0
  return digits.slice(0, maxLocal);
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
      [
        n,
        phone.trim(),
        `${c.phonePrefix}${local}`,
        `+${c.phonePrefix}${local}`,
        usesLeadingZero(c.code) ? `0${local}` : local,
      ].filter(Boolean),
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
    return (
      local.length >= c.phoneLocalDigits - 1 &&
      local.length <= c.phoneLocalDigits + 1
    );
  }

  if (digits.startsWith("0")) {
    return (
      digits.length >= c.phoneLocalDigits &&
      digits.length <= c.phoneLocalDigits + 1
    );
  }

  if (c.code === "IN") {
    return /^[6-9]\d{9}$/.test(digits);
  }

  return (
    digits.length >= c.phoneLocalDigits - 1 &&
    digits.length <= c.phoneLocalDigits + 1
  );
}

/**
 * Live digit-count feedback while the rider types a mobile number.
 * Uses each market's `phoneLocalDigits` — no hardcoded lengths.
 */
export function phoneDigitFeedback(
  phone: string,
  countryCode?: string | null,
): {
  entered: number;
  expected: number;
  status: "empty" | "short" | "ok" | "long";
  message: string | null;
} {
  const c = getCountry(countryCode);
  const digits = phone.replace(/\D/g, "");
  const withTrunkZero = usesLeadingZero(c.code);

  if (!digits) {
    const expected = withTrunkZero
      ? c.phoneLocalDigits + 1
      : c.phoneLocalDigits;
    return { entered: 0, expected, status: "empty", message: null };
  }

  let entered = digits.length;
  let expected = withTrunkZero
    ? c.phoneLocalDigits + 1
    : c.phoneLocalDigits;

  if (digits.startsWith(c.phonePrefix)) {
    entered = digits.length - c.phonePrefix.length;
    expected = c.phoneLocalDigits;
  } else if (withTrunkZero && !digits.startsWith("0")) {
    // National number without trunk 0 (e.g. 821234567)
    expected = c.phoneLocalDigits;
  }

  if (entered < expected) {
    const left = expected - entered;
    return {
      entered,
      expected,
      status: "short",
      message: `Too few digits — need ${expected}, you entered ${entered} (${left} more)`,
    };
  }
  if (entered > expected) {
    return {
      entered,
      expected,
      status: "long",
      message: `Too many digits — need ${expected}, you entered ${entered}`,
    };
  }
  return { entered, expected, status: "ok", message: null };
}

/** @deprecated use isValidMobileForCountry — kept for SA-only call sites. */
export function isSouthAfricanMobileCompat(phone: string): boolean {
  return isValidMobileForCountry(phone, "ZA" satisfies CountryCode);
}
