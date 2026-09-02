/** POPIA: GPS only after the rider agrees. Landmark text still works if they say no. */
export const LOCATION_CONSENT_KEY = "vr_location_consent_v1";

export const LOCATION_CONSENT_COPY =
  "Village Ride uses your GPS to pin pickup and find nearby drivers. Landmark text still works if you tap Cancel.";

export function readLocationConsent(): boolean {
  try {
    return localStorage.getItem(LOCATION_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function grantLocationConsent() {
  try {
    localStorage.setItem(LOCATION_CONSENT_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** Returns true if the rider already agreed, or agrees now. */
export function ensureLocationConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (readLocationConsent()) return true;
  const ok = window.confirm(LOCATION_CONSENT_COPY);
  if (ok) grantLocationConsent();
  return ok;
}
