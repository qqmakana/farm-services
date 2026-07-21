/** In-app driver recruitment promo — localStorage helpers. */

const BANNER_DISMISS_KEY = "vr_driver_wanted_banner_dismissed_at";
const NOTICE_SEEN_KEY = "vr_driver_wanted_notice_v1";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isDriverWantedBannerVisible(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(BANNER_DISMISS_KEY);
    if (!raw) return true;
    const at = Number(raw);
    if (!Number.isFinite(at)) return true;
    return Date.now() - at >= SEVEN_DAYS_MS;
  } catch {
    return true;
  }
}

export function dismissDriverWantedBanner(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function hasSeenDriverWantedNotice(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(NOTICE_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markDriverWantedNoticeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTICE_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}
