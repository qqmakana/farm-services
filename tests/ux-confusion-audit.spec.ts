import { test, expect, type Page } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

/**
 * Installation / onboarding / UX confusion audit (clueless first-time user).
 * Asserts what the code + live UI actually do vs the 3-tab Uber mental model.
 */

async function ready(page: Page, path: string) {
  await page.goto(path);
  await dismissCountryModalIfPresent(page);
}

test.describe("Phase 1 — PWA / install surface", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  test("manifest is standalone with icons", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/manifest.webmanifest`);
    expect(res.ok()).toBeTruthy();
    const m = await res.json();
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBeTruthy();
    expect(Array.isArray(m.icons) && m.icons.length >= 2).toBeTruthy();
  });

  test("service worker route responds", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/sw.js`);
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toMatch(/village-ride|CACHE|precache/i);
  });

  test("/get-app install page loads with CTA", async ({ page }) => {
    await ready(page, "/get-app");
    await expect(
      page.getByRole("button", { name: /Download app|Install app/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("offline banner appears when network drops", async ({ page, context }) => {
    await ready(page, "/");
    await expect(page.locator("body")).toBeVisible();
    await context.setOffline(true);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        get: () => false,
      });
      window.dispatchEvent(new Event("offline"));
    });
    await expect(page.getByText(/You're offline/i)).toBeVisible({
      timeout: 10_000,
    });
    await context.setOffline(false);
  });
});

test.describe("Phase 2 — Driver join & status", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  test("/driver/join form asks for photos + conduct", async ({ page }) => {
    await ready(page, "/driver/join");
    await expect(
      page.getByRole("heading", { name: /Apply now|Earn with your car/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('input[type="file"]').first()).toBeVisible();
    await expect(page.getByText(/Code of Conduct|conduct/i).first()).toBeVisible();
    await expect(page.getByText(/JPEG\/PNG|5MB/i).first()).toBeVisible();
  });

  test("driver account shows Pending vs Verified chip when logged into mock driver", async ({
    page,
  }) => {
    await ready(page, "/driver");
    const select = page.locator("select").first();
    if (await select.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await select.selectOption({ index: 0 });
      const enter = page.getByRole("button", { name: /Enter driver app/i });
      if (await enter.isVisible().catch(() => false)) {
        await enter.click();
      }
    }
    await page.goto("/driver/account");
    await dismissCountryModalIfPresent(page);
    // Mock seed drivers are typically verified; chip must exist either way
    const status = page.getByTestId("driver-verification-status");
    await expect(status).toBeVisible({ timeout: 15_000 });
    await expect(
      status.getByText(/Verified & Active|Pending Verification|Action Required/i),
    ).toBeVisible();
  });
});

test.describe("Phase 3 — Nav confusion & checkout clarity", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  test("rider bottom nav has exactly 4 tabs (Home · Services · Activity · Account)", async ({
    page,
  }) => {
    await ready(page, "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toBeVisible({ timeout: 15_000 });
    const labels = await nav.locator("a").allTextContents();
    const cleaned = labels.map((t) => t.trim()).filter(Boolean);
    expect(cleaned.length).toBe(4);
    expect(cleaned.some((t) => /Home/i.test(t))).toBeTruthy();
    expect(cleaned.some((t) => /Services/i.test(t))).toBeTruthy();
    expect(cleaned.some((t) => /Activity/i.test(t))).toBeTruthy();
    expect(cleaned.some((t) => /Account/i.test(t))).toBeTruthy();
    await expect(page.getByTestId("uber-home")).toBeVisible();
    await expect(page.getByTestId("home-chips")).toBeVisible();
    await expect(page.getByTestId("service-circles")).toBeVisible();
    await expect(page.getByTestId("home-where-to")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Request a ride/i })).toBeVisible();
  });

  test("driver bottom nav has exactly 3 tabs (Jobs · Earnings · Account)", async ({
    page,
  }) => {
    await ready(page, "/driver");
    const select = page.locator("select").first();
    if (await select.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await select.selectOption({ index: 0 });
      const enter = page.getByRole("button", { name: /Enter driver app/i });
      if (await enter.isVisible().catch(() => false)) await enter.click();
    }
    await page.goto("/driver/home");
    await dismissCountryModalIfPresent(page);
    const nav = page.getByRole("navigation", { name: "Driver" });
    await expect(nav).toBeVisible({ timeout: 15_000 });
    const labels = await nav.locator("a").allTextContents();
    const cleaned = labels.map((t) => t.trim()).filter(Boolean);
    expect(cleaned.length).toBe(3);
    expect(cleaned.some((t) => /^Jobs$/i.test(t))).toBeTruthy();
    expect(cleaned.some((t) => /Earnings/i.test(t))).toBeTruthy();
    expect(cleaned.some((t) => /Account/i.test(t))).toBeTruthy();
    expect(cleaned.some((t) => /^Home$/i.test(t))).toBeFalsy();
    expect(cleaned.some((t) => /Groups/i.test(t))).toBeFalsy();
  });

  test("rider cannot see driver earnings tab bar on /", async ({ page }) => {
    await ready(page, "/");
    await expect(page.getByRole("navigation", { name: "Driver" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  });

  test("delivery checkout shows fare breakdown lines", async ({ page }) => {
    await ready(page, "/delivery");
    await expect(page.getByTestId("fare-breakdown")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("base-fare")).toBeVisible();
    await expect(page.getByTestId("platform-fee")).toBeVisible();
    await expect(page.getByTestId("total-fare")).toBeVisible();
    await expect(page.getByTestId("payment-selector")).toBeVisible();
  });

  test("ride checkout shows FareBreakdownCard + cash/card", async ({
    page,
  }) => {
    await ready(page, "/ride");
    await expect(page.getByTestId("fare-breakdown")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("base-fare")).toBeVisible();
    await expect(page.getByTestId("platform-fee")).toBeVisible();
    await expect(page.getByTestId("total-fare")).toBeVisible();
    await expect(page.getByTestId("payment-selector")).toBeVisible();
  });

  test("courier checkout shows FareBreakdownCard + cash/card", async ({
    page,
  }) => {
    await ready(page, "/courier");
    await expect(page.getByTestId("fare-breakdown")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("base-fare")).toBeVisible();
    await expect(page.getByTestId("platform-fee")).toBeVisible();
    await expect(page.getByTestId("total-fare")).toBeVisible();
    await expect(page.getByTestId("payment-selector")).toBeVisible();
  });

  test("back from /ride keeps shell (pickup bar still present)", async ({
    page,
  }) => {
    await ready(page, "/ride");
    await page.getByTestId("dropoff-input").fill("Town market");
    await page.goBack();
    // May land on / — search bar or home should still be usable
    await expect(page.locator("body")).toBeVisible();
    const onRide = page.url().includes("/ride");
    if (onRide) {
      await expect(page.getByTestId("pickup-input")).toBeVisible();
    } else {
      // Navigated away — document that browser back leaves booking (UX debt)
      test.info().annotations.push({
        type: "ux-debt",
        description: `Browser back left /ride → ${page.url()}`,
      });
    }
  });
});
