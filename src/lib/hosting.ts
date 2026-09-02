/**
 * Launch hosting — stay here on purpose.
 * Vercel Hobby ($0) + Supabase Free. Do not assume Pro.
 *
 * Hobby: ~1M function invocations / month. Hitting the cap pauses the project.
 * Sub-daily Vercel Cron is not available — dispatch uses GitHub Actions.
 * Supabase Free: Realtime + DB connections are limited; idle projects can pause.
 */
export const HOSTING = {
  vercel: "hobby",
  supabase: "free",
} as const;

/** Poll slower than Uber so 5 drivers + a few live trips fit Hobby. */
export const HOBBY_POLL_MS = {
  searching: 8_000,
  liveTrip: 12_000,
  driverOffers: 8_000,
  driverJobs: 10_000,
  driverGps: 12_000,
} as const;
