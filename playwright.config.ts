import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

/**
 * Uber-style E2E against the in-memory mock store.
 * Starts Next with VILLAGE_RIDE_USE_MOCK=1 so both browser contexts share jobs/drivers.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    geolocation: { latitude: -31.5833, longitude: 28.7833 },
    permissions: ["geolocation", "notifications"],
    locale: "en-ZA",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next build && npx next start --hostname 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      ...process.env,
      VILLAGE_RIDE_USE_MOCK: "1",
      // Ensure mock wins even if .env.local has Supabase keys
      SUPABASE_SERVICE_ROLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
    },
  },
});
