/**
 * Cleanup helpers for E2E.
 * Local mock store resets when the Next process restarts (webServer).
 * Production: do not create persistent merchants — smoke tests only.
 */

export function assertSafeForDestructiveTests(baseURL: string | undefined) {
  if (baseURL?.includes("village-ride.vercel.app")) {
    throw new Error(
      "Refusing destructive cleanup against production. Use PLAYWRIGHT_TARGET=local (mock).",
    );
  }
}

export async function noteCleanup(label: string) {
  // Mock mode: process restart clears in-memory store.
  // Live Supabase: would delete by email prefix test+*@village-ride.co.za via service role.
  console.log(`[cleanup] ${label} — mock store cleared on next webServer restart`);
}
