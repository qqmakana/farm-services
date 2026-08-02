/** Driver first-login guide — localStorage gate. */

const KEY = "vr_driver_onboarding_seen_v1";
const SESSION_SKIP = "vr_driver_onboarding_skip_session";

export function shouldShowDriverOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(KEY) === "1") return false;
    if (sessionStorage.getItem(SESSION_SKIP) === "1") return false;
    return true;
  } catch {
    return false;
  }
}

export function markDriverOnboardingSeen(): void {
  try {
    localStorage.setItem(KEY, "1");
    sessionStorage.removeItem(SESSION_SKIP);
  } catch {
    /* ignore */
  }
}

export function skipDriverOnboardingForSession(): void {
  try {
    sessionStorage.setItem(SESSION_SKIP, "1");
  } catch {
    /* ignore */
  }
}

export function resetDriverOnboardingForReplay(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(SESSION_SKIP);
  } catch {
    /* ignore */
  }
}
