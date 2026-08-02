/** Guest rider referral codes (R50 when referred user completes a ride). */

import { getGuestProfile, setGuestProfile } from "@/lib/guest-profile";

const REF_KEY = "vr_referral_code_v1";
const CAPTURED_KEY = "vr_referred_by_v1";

export function getOrCreateReferralCode(phone?: string): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(REF_KEY);
    if (existing) return existing;
    const digits = (phone || getGuestProfile()?.phone || "")
      .replace(/\D/g, "")
      .slice(-4);
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    const code = `VR${digits || "0000"}${rand}`;
    localStorage.setItem(REF_KEY, code);
    return code;
  } catch {
    return "";
  }
}

export function captureReferralFromUrl(search: string): void {
  if (typeof window === "undefined") return;
  try {
    const ref = new URLSearchParams(search).get("ref")?.trim().toUpperCase();
    if (!ref || !/^VR[A-Z0-9]+$/.test(ref)) return;
    const mine = localStorage.getItem(REF_KEY);
    if (mine && mine === ref) return;
    localStorage.setItem(CAPTURED_KEY, ref);
  } catch {
    /* ignore */
  }
}

export function getCapturedReferrer(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CAPTURED_KEY);
  } catch {
    return null;
  }
}

export function referralShareUrl(code: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "https://village-ride.vercel.app");
  return `${base}/?ref=${encodeURIComponent(code)}`;
}

/** Ensure guest profile exists before sharing (optional name). */
export function ensureGuestForReferral(name: string, phone: string) {
  if (!phone.trim()) return;
  setGuestProfile({
    name: name.trim() || getGuestProfile()?.name || "Guest",
    phone,
  });
}
