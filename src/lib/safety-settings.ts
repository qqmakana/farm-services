/** Rider safety prefs — local first so old phones work without a migration. */

const KEY = "vr_safety_settings_v1";

export type SafetySettings = {
  emergency_name: string;
  emergency_phone: string;
  /** Four digits. Typed as a word in trip chat → silent SOS. */
  panic_code: string;
};

const EMPTY: SafetySettings = {
  emergency_name: "",
  emergency_phone: "",
  panic_code: "",
};

function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

export function normalizePanicCode(value: string): string {
  return digitsOnly(value).slice(0, 4);
}

export function isValidPanicCode(value: string): boolean {
  return /^\d{4}$/.test(normalizePanicCode(value));
}

export function getSafetySettings(): SafetySettings {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<SafetySettings>;
    return {
      emergency_name: String(parsed.emergency_name ?? "").trim(),
      emergency_phone: String(parsed.emergency_phone ?? "").trim(),
      panic_code: normalizePanicCode(String(parsed.panic_code ?? "")),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function setSafetySettings(next: Partial<SafetySettings>): SafetySettings {
  const current = getSafetySettings();
  const merged: SafetySettings = {
    emergency_name: String(next.emergency_name ?? current.emergency_name).trim(),
    emergency_phone: String(next.emergency_phone ?? current.emergency_phone).trim(),
    panic_code: normalizePanicCode(
      String(next.panic_code ?? current.panic_code),
    ),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* private mode */
  }
  return merged;
}

/** True when the message contains the 4-digit code as its own word. */
export function messageContainsPanicCode(
  message: string,
  code: string,
): boolean {
  const panic = normalizePanicCode(code);
  if (!isValidPanicCode(panic)) return false;
  const text = String(message || "");
  return new RegExp(`(^|[^0-9])${panic}([^0-9]|$)`).test(text);
}

export function safetyContactSmsHref(
  phone: string,
  mapsUrl: string,
  riderName?: string,
): string | null {
  const digits = digitsOnly(phone);
  if (digits.length < 9) return null;
  const who = riderName?.trim() || "I";
  const body = `Village Ride safety: ${who} asked me to check in. Location: ${mapsUrl}`;
  return `sms:${digits}?body=${encodeURIComponent(body)}`;
}

export function safetyContactWhatsAppHref(
  phone: string,
  mapsUrl: string,
  riderName?: string,
): string | null {
  const digits = digitsOnly(phone);
  if (digits.length < 9) return null;
  const intl = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  const who = riderName?.trim() || "I";
  const body = `Village Ride safety: ${who} asked me to check in. Location: ${mapsUrl}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(body)}`;
}
