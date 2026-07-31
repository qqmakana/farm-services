/**
 * Onboarding visibility:
 * - Permanent dismiss → localStorage (Get started / Don't show again)
 * - Session skip → sessionStorage (Skip for now — returns next visit)
 */

/** v2 = corrected tour (describe-when-maps-fail / wearing / fuel) — no shops slide. */
const PERMANENT_KEY = "vr_feature_tour_seen_v2";
const LEGACY_PERMANENT_KEYS = [
  "vr_feature_tour_seen_v1",
  "vr_onboarding_seen_v1",
] as const;
const SESSION_SKIP_KEY = "vr_feature_tour_skip_session";
const LEGACY_SESSION_SKIP_KEY = "vr_onboarding_skip_session";

export function hasPermanentlyDismissedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    // Only the current tour version counts as done.
    return localStorage.getItem(PERMANENT_KEY) === "1";
  } catch {
    return true;
  }
}

/** @deprecated Prefer hasPermanentlyDismissedOnboarding */
export function hasSeenOnboarding(): boolean {
  return hasPermanentlyDismissedOnboarding();
}

export function hasSkippedOnboardingThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem(SESSION_SKIP_KEY) === "1" ||
      sessionStorage.getItem(LEGACY_SESSION_SKIP_KEY) === "1"
    );
  } catch {
    return false;
  }
}

/** Home gate: show tour unless permanently dismissed or skipped this session. */
export function shouldShowOnboarding(): boolean {
  if (hasPermanentlyDismissedOnboarding()) return false;
  if (hasSkippedOnboardingThisSession()) return false;
  return true;
}

/** Get started / Don't show again — never auto-show again. */
export function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PERMANENT_KEY, "1");
    for (const key of LEGACY_PERMANENT_KEYS) {
      localStorage.setItem(key, "1");
    }
    sessionStorage.removeItem(SESSION_SKIP_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_SKIP_KEY);
  } catch {
    /* ignore */
  }
}

/** Skip for now — come back next browser session. */
export function skipOnboardingForSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_SKIP_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Account → Replay: clear flags so the tour can run again. */
export function resetOnboardingForReplay(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PERMANENT_KEY);
    for (const key of LEGACY_PERMANENT_KEYS) {
      localStorage.removeItem(key);
    }
    sessionStorage.removeItem(SESSION_SKIP_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_SKIP_KEY);
  } catch {
    /* ignore */
  }
}
