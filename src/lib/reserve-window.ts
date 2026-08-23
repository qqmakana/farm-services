/** Uber Reserve-style window for scheduled Trip bookings only. */
export const RESERVE_MIN_MINUTES = 30;
export const RESERVE_MAX_DAYS = 30;

const SLACK_MS = 60_000;

export function reserveMinMs(): number {
  return RESERVE_MIN_MINUTES * 60 * 1000;
}

export function reserveMaxMs(): number {
  return RESERVE_MAX_DAYS * 24 * 60 * 60 * 1000;
}

/** Error if a scheduled ride is outside 30 minutes–30 days. `null` when OK or unset. */
export function reserveWindowError(
  iso: string | null | undefined,
  now = Date.now(),
): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "Pick a valid date and time.";
  if (t < now + reserveMinMs() - SLACK_MS) {
    return "Reserve needs at least 30 minutes’ notice.";
  }
  if (t > now + reserveMaxMs()) {
    return "Reserve can be up to 30 days ahead.";
  }
  return null;
}
