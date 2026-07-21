/** First-visit product tour — localStorage flag. */

const KEY = "vr_onboarding_seen_v1";

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}
