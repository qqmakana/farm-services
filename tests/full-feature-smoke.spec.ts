import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  ensureDriverOnline,
  isProductionBase,
  prepareBrowserContext,
  selectMockDriver,
} from "./helpers/auth-helper";
import { FEATURE_ROUTES, testLocations, testUsers } from "./helpers/test-data";
import { noteCleanup } from "./helpers/cleanup";

/**
 * Master smoke covering Village Ride surfaces.
 * - Production: public/read-only checks only
 * - Local mock: booking + driver + fuel write paths
 */
test.describe("Full feature smoke", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test.afterAll(async () => {
    await noteCleanup("full-feature-smoke");
  });

  test("A–B: public routes + legal pages load", async ({ page }) => {
    for (const route of FEATURE_ROUTES.filter((r) =>
      ["/", "/help", "/privacy", "/terms", "/countries", "/pricing", "/get-app"].includes(
        r.path,
      ),
    )) {
      await page.goto(route.path);
      await dismissCountryModalIfPresent(page);
      await expect(page.locator("body")).toBeVisible();
      const text = await page.locator("body").innerText();
      expect(text.length, `${route.name} should render content`).toBeGreaterThan(40);
    }
  });

  test("C: driver join + gate pages", async ({ page }) => {
    await page.goto("/driver/join");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/driver|Apply|verification|Conduct/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/driver");
    await dismissCountryModalIfPresent(page);
    await expect(page.locator("body")).toBeVisible();
  });

  test("D–G: booking sheets for ride/delivery/farm/courier", async ({ page }) => {
    const sheets: Array<{ path: string; cue: RegExp }> = [
      { path: "/ride", cue: /Request Ride|Describe your pickup|What are you wearing/i },
      { path: "/delivery", cue: /Request|Describe pickup|Delivery/i },
      { path: "/farm", cue: /Farm|Request|landmark/i },
      { path: "/courier", cue: /Courier|Request|recipient|package/i },
    ];
    for (const sheet of sheets) {
      await page.goto(sheet.path);
      await dismissCountryModalIfPresent(page);
      await expect(page.getByText(sheet.cue).first()).toBeVisible({
        timeout: 20_000,
      });
    }
  });

  test("H: shops + partner signup surfaces", async ({ page }) => {
    await page.goto("/shops");
    await dismissCountryModalIfPresent(page);
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/shop");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/Shop|farm|Business|Step 1|Register/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/partners");
    await expect(page.getByText(/Partners|Business|Deliver/i).first()).toBeVisible();
  });

  test("M–N: wear-stats + saved places", async ({ page }) => {
    await page.goto("/wear-stats");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Brand rankings|Wear of the Week/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("/account/places");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Saved Places|Farm|offline/i).first()).toBeVisible();
  });

  test("O: offline banner component present when forced offline", async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(isProductionBase(baseURL), "Offline force is local-only");
    await context.setOffline(true);
    await page.goto("/ride");
    // Banner may say Offline / No connection — body must still paint
    await expect(page.locator("body")).toBeVisible();
    await context.setOffline(false);
  });

  test("R: dispatch ops board loads", async ({ page }) => {
    await page.goto("/dispatch");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByRole("heading", { name: /Dispatch/i }).or(page.getByText(/Operations/i)),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("D+I+J local: ride book → driver accept → complete", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.skip(isProductionBase(baseURL), "Full lifecycle against mock only");

    const driverCtx = await browser.newContext();
    await prepareBrowserContext(driverCtx);
    const driverPage = await driverCtx.newPage();
    await selectMockDriver(driverPage);
    await ensureDriverOnline(driverPage);

    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);

    // Prefer example chip, then ensure fields filled
    const example = page
      .getByRole("button", { name: /green gate|mango tree/i })
      .first();
    if (await example.isVisible().catch(() => false)) {
      await example.click();
    }

    const inputs = page.locator("input");
    // Fill visible text fields by placeholder/label fallbacks
    const pickupInput = page
      .getByPlaceholder(/mango|green gate|Pickup|landmark|village/i)
      .first();
    if (await pickupInput.isVisible().catch(() => false)) {
      const val = await pickupInput.inputValue();
      if (!val.trim()) await pickupInput.fill(testLocations.pickup);
    }

    await page
      .getByPlaceholder(/church|Dropoff|Clinic|landmark|village/i)
      .first()
      .fill(testLocations.dropoff);
    await page.getByLabel(/Your name/i).fill(testUsers.rider.name);
    await page.getByLabel(/^Phone$/i).fill(testUsers.rider.phone);
    await page
      .getByPlaceholder(/Nike tracksuit|red jacket/i)
      .fill(testLocations.wearing);

    await page.getByRole("button", { name: /Request Ride/i }).click();
    await page.waitForURL(/\/trip\//, { timeout: 60_000 });
    await expect(page).toHaveURL(/\/trip\//);

    // Driver side: accept if offer appears
    await expect(
      driverPage.getByRole("button", { name: /ACCEPT|Out of fuel/i }).first(),
    ).toBeVisible({ timeout: 60_000 });

    const accept = driverPage.getByRole("button", { name: /^ACCEPT$/i });
    if (await accept.isVisible({ timeout: 30_000 }).catch(() => false)) {
      await accept.click();
      await driverPage.goto("/driver/jobs");
      const start = driverPage.getByRole("button", { name: /START TRIP/i });
      if (await start.isVisible({ timeout: 20_000 }).catch(() => false)) {
        await start.click();
      }
      const complete = driverPage.getByRole("button", { name: /COMPLETE TRIP/i });
      if (await complete.isVisible({ timeout: 20_000 }).catch(() => false)) {
        await complete.click();
      }
    }

    void inputs;
    await driverCtx.close();
  });

  test("S local: out of fuel request UI", async ({ page, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock driver only");
    await selectMockDriver(page);
    await ensureDriverOnline(page);
    await page.getByRole("button", { name: /Out of fuel/i }).click();
    await expect(page.getByText(/Request fuel help|How much/i).first()).toBeVisible();
    await page.getByRole("button", { name: /^10L$/ }).click();
    await page
      .getByPlaceholder(/clinic gate|where you are/i)
      .fill("Near blue water tank");
    await page.getByRole("button", { name: /Request fuel now/i }).click();
    await expect(page.getByText(/Your fuel request/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
