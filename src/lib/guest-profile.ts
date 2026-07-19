/** Frictionless guest profile — name + phone in localStorage (no auth). */

export type GuestProfile = {
  name: string;
  phone: string;
};

const KEY = "village_ride_guest_profile";

/** Digits-only SA form: 0XXXXXXXXX when possible. */
export function normalizeGuestPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length >= 11) {
    return `0${digits.slice(2, 11)}`;
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    return digits.slice(0, 10);
  }
  return digits;
}

/** Match variants (0xx / 27xx) for job lookup. */
export function phoneMatchVariants(phone: string): string[] {
  const n = normalizeGuestPhone(phone);
  if (!n) return [];
  const local = n.startsWith("0") ? n.slice(1) : n;
  const variants = new Set<string>([
    n,
    phone.trim(),
    `27${local}`,
    `+27${local}`,
    `0${local}`,
  ]);
  return [...variants].filter(Boolean);
}

export function getGuestProfile(): GuestProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestProfile;
    if (!parsed?.phone) return null;
    return {
      name: String(parsed.name ?? "").trim(),
      phone: normalizeGuestPhone(String(parsed.phone)),
    };
  } catch {
    return null;
  }
}

export function setGuestProfile(profile: GuestProfile): void {
  if (typeof window === "undefined") return;
  const next: GuestProfile = {
    name: profile.name.trim(),
    phone: normalizeGuestPhone(profile.phone),
  };
  if (!next.phone) return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearGuestProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
