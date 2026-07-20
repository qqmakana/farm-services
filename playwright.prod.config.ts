import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "https://village-ride.vercel.app";

/** Production smoke — no local webServer, no destructive merchant/driver writes. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "en-ZA",
  },
  projects: [
    {
      name: "production",
      testMatch:
        /public-pages\.spec\.ts|performance\.spec\.ts|security\.spec\.ts|ops-ready\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
