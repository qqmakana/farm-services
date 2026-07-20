import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  isProductionBase,
  prepareBrowserContext,
} from "./helpers/auth-helper";

/**
 * Security smoke tests.
 * Production: merchant/admin routes must require login.
 * Local mock (no Supabase): middleware allows through — document that gap.
 */
test.describe("Security & access control", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  test("production merchant dashboard redirects unauthenticated users", async ({
    page,
    baseURL,
  }) => {
    test.skip(
      !isProductionBase(baseURL),
      "Only asserts live auth gate on production",
    );
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);
    await expect(page).toHaveURL(/\/login/i, { timeout: 20_000 });
  });

  test("production admin verifications redirects unauthenticated users", async ({
    page,
    baseURL,
  }) => {
    test.skip(
      !isProductionBase(baseURL),
      "Only asserts live auth gate on production",
    );
    await page.goto("/admin/verifications");
    await expect(page).toHaveURL(/\/login/i, { timeout: 20_000 });
  });

  test("e2e driver API blocked outside mock", async ({ request, baseURL }) => {
    test.skip(!isProductionBase(baseURL), "Asserts prod denies mock helper");
    const res = await request.get("/api/e2e/driver?driverId=d1");
    // Should be 403/404/401 — not leak driver wallet
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("local mock dashboard accessible without session", async ({
    page,
    baseURL,
  }) => {
    test.skip(isProductionBase(baseURL), "Mock-only");
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);
    // With Supabase keys cleared, middleware does not gate
    await expect(page.getByText(/Partner|Create delivery|Mthatha/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
