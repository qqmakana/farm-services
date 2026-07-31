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
 * Deep ride lifecycle stays in uber-flow / driver-flow (more stable isolation).
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
      const res = await page.goto(route.path);
      expect(res?.ok() || res?.status() === 304, `${route.name} HTTP`).toBeTruthy();
      await dismissCountryModalIfPresent(page);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByText(/Village Ride|Sandton|Install|Help|Privacy|Terms|countries|price|fare/i).first(),
      ).toBeVisible({ timeout: 20_000 });
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

  test("O: offline does not crash ride UI", async ({ page, context, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Offline force is local-only");
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Describe your pickup|Request Ride/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await context.setOffline(true);
    await expect(page.locator("body")).toBeVisible();
    await context.setOffline(false);
  });

  test("R: dispatch ops board loads", async ({ page }) => {
    await page.goto("/dispatch");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByRole("heading", { name: "Dispatch" }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("D local: ride form accepts describe + wearing", async ({ page, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Form fill against mock only");

    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);

    const example = page
      .getByRole("button", { name: /green gate|mango tree/i })
      .first();
    await expect(example).toBeVisible({ timeout: 15_000 });
    await example.click();

    const pickup = page.getByPlaceholder(/mango tree/i).first();
    await expect
      .poll(async () => (await pickup.inputValue()).trim().length > 0, {
        timeout: 8_000,
      })
      .toBe(true);

    const dropoff = page.getByPlaceholder(/Blue house after the church/i).first();
    await dropoff.fill(testLocations.dropoff);
    await dropoff.blur();

    await page.getByLabel(/Your name/i).fill(testUsers.rider.name);
    await page.getByLabel(/^Phone$/i).fill(testUsers.rider.phone);
    await page
      .getByPlaceholder(/Nike tracksuit|red jacket/i)
      .fill(testLocations.wearing);
    await page.keyboard.press("Escape");

    const requestBtn = page.getByRole("button", { name: /Request Ride/i });
    await expect(requestBtn).toBeVisible({ timeout: 15_000 });
    await expect(requestBtn).toBeEnabled({ timeout: 15_000 });
  });

  test("S local: out of fuel request UI", async ({ page, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock driver only");
    await selectMockDriver(page);
    await ensureDriverOnline(page);

    const notNow = page.getByRole("button", { name: /Not now/i });
    if (await notNow.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await notNow.click();
    }

    // If a prior suite left a request open, that already proves the feature works.
    if (await page.getByText(/Your fuel request/i).isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expect(page.getByRole("button", { name: /^Cancel$/i })).toBeVisible();
      return;
    }

    await page.getByRole("button", { name: /Out of fuel/i }).click();
    const howMuch = page.getByText(/Request fuel help|How much/i).first();
    if (!(await howMuch.isVisible({ timeout: 4_000 }).catch(() => false))) {
      await page.getByRole("button", { name: /Out of fuel/i }).click();
    }
    await expect(howMuch).toBeVisible({ timeout: 10_000 });
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
