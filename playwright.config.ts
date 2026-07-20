import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const TARGET = process.env.PLAYWRIGHT_TARGET || "local";
const isProd = TARGET === "production";
const BASE_URL = isProd
  ? process.env.PLAYWRIGHT_BASE_URL || "https://village-ride.vercel.app"
  : process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

/**
 * Local (default): in-memory mock store — full merchant/driver journeys.
 * Production: `PLAYWRIGHT_TARGET=production` — public smoke + performance only.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: isProd ? 60_000 : 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    geolocation: { latitude: -31.5833, longitude: 28.7833 },
    permissions: ["geolocation", "notifications"],
    locale: "en-ZA",
  },
  projects: isProd
    ? [
        {
          name: "production",
          testMatch: /public-pages\.spec\.ts|performance\.spec\.ts|security\.spec\.ts/,
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "production-mobile",
          testMatch: /public-pages\.spec\.ts/,
          use: { ...devices["Pixel 5"] },
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "mobile",
          testMatch: /public-pages\.spec\.ts/,
          use: { ...devices["Pixel 5"] },
        },
      ],
  webServer: isProd
    ? undefined
    : {
        command: `npx next build && npx next start --hostname 127.0.0.1 --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: {
          ...process.env,
          VILLAGE_RIDE_USE_MOCK: "1",
          // Force mock: no live Supabase auth gate for /merchant
          SUPABASE_SERVICE_ROLE_KEY: "",
          SUPABASE_SECRET_KEY: "",
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
        },
      },
});
