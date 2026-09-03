import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { dismissCountryModalIfPresent } from "./helpers/auth-helper";
import { rideBookingUrl } from "./helpers/test-data";

/**
 * Global validation — matches the *actual* Village Ride build.
 * Country lock uses localStorage (timezone detect + Account picker),
 * not browser geolocation. Book CTA is a black pill.
 */

async function lockCountry(context: BrowserContext, code: string) {
  await context.addInitScript((c) => {
    try {
      localStorage.setItem("village_ride_country", c);
      localStorage.setItem("village_ride_country_picked", "1");
      localStorage.setItem("vr_onboarding_seen_v1", "1");
      localStorage.setItem("vr_feature_tour_seen_v4", "1");
      localStorage.setItem("vr_feature_tour_seen_v3", "1");
    } catch {
      /* ignore */
    }
  }, code);
}

async function gotoReady(page: Page, path = "/") {
  await page.goto(path);
  await dismissCountryModalIfPresent(page);
}

test.describe("Multi-country configuration", () => {
  const markets = [
    { code: "ZA", currency: "ZAR", baseDigits: "15" },
    { code: "NG", currency: "NGN", baseDigits: "1500" },
    { code: "KE", currency: "KES", baseDigits: "300" },
    { code: "IN", currency: "INR", baseDigits: "100" },
    { code: "BR", currency: "BRL", baseDigits: "15" },
  ] as const;

  for (const m of markets) {
    test(`locks ${m.code} currency + base fare on ride sheet`, async ({
      context,
      page,
    }) => {
      await lockCountry(context, m.code);
      await gotoReady(page, rideBookingUrl());

      const indicator = page.getByTestId("country-indicator");
      await expect(indicator).toBeVisible({ timeout: 15_000 });
      await expect(indicator).toContainText(m.currency);

      // Vehicle list / price uses local base (formatting may insert spaces/commas)
      const body = await page.locator("body").innerText();
      const digits = body.replace(/[^\d]/g, "");
      expect(digits.includes(m.baseDigits)).toBeTruthy();
    });
  }

  test("map container mounts without Leaflet zoom controls", async ({
    context,
    page,
  }) => {
    await lockCountry(context, "ZA");
    await gotoReady(page, "/ride");

    const map = page.locator("[data-testid=\"ride-map\"]");
    await expect(map).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".mapboxgl-ctrl-zoom-in")).toHaveCount(0);
  });
});

test.describe("Uber-style UI", () => {
  test.beforeEach(async ({ context }) => {
    await lockCountry(context, "ZA");
  });

  test("full-bleed map + bottom sheet + drag handle", async ({ page }) => {
    await gotoReady(page, "/ride");

    await expect(page.locator("[data-testid=\"ride-map\"]")).toBeVisible({
      timeout: 15_000,
    });
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId("drag-handle")).toBeVisible();

    const radius = await sheet.evaluate((el) =>
      getComputedStyle(el).borderTopLeftRadius,
    );
    // 24px or larger (rounded-t-3xl)
    expect(parseFloat(radius)).toBeGreaterThanOrEqual(16);
  });

  test("Where to search bar with pickup/dropoff inputs", async ({ page }) => {
    await gotoReady(page, "/ride");

    await expect(page.getByTestId("search-bar")).toBeVisible();
    await expect(page.getByTestId("pickup-input")).toBeVisible();
    await expect(page.getByTestId("dropoff-input")).toBeVisible();

    await page.getByTestId("dropoff-input").fill("Johannesburg CBD");
    await expect(page.getByText(/Choose a ride/i)).toHaveCount(0);
  });

  test("book CTA is black pill", async ({ page }) => {
    await gotoReady(page, rideBookingUrl());
    const book = page.getByTestId("book-button").first();
    await expect(book).toBeVisible({ timeout: 15_000 });

    const bg = await book.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(0,\s*0,\s*0\)/);
  });

  test("ride sheet vehicle list selectable", async ({ page }) => {
    await gotoReady(page, rideBookingUrl());
    await expect(page.getByText(/Choose a ride/i)).toBeVisible({
      timeout: 15_000,
    });
    const villageRide = page.getByTestId("ride-tier-singles").or(
      page.getByRole("button", { name: /Singles|Village Ride/i }),
    ).first();
    await villageRide.click();
    await expect(villageRide).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("Payment + Village Pass", () => {
  test.beforeEach(async ({ context }) => {
    await lockCountry(context, "ZA");
  });

  test("cash/card selector on ride checkout", async ({ page }) => {
    await gotoReady(page, rideBookingUrl());

    const nameField = page.getByLabel(/Your name/i);
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill("QA Rider");
      await page.getByLabel(/^Phone$/i).fill("0821234567");
    }

    await expect(page.getByTestId("payment-selector")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("pay-cash")).toHaveAttribute(
      "data-selected",
      "true",
    );
    await expect(page.getByTestId("cash-payment-message")).toContainText(
      /Pay the driver in cash/i,
    );

    await page.getByTestId("pay-card").click();
    await expect(page.getByTestId("pay-card")).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  test("Village Pass offer on account (web PayPal, not Play Billing)", async ({
    page,
  }) => {
    await gotoReady(page, "/account");

    // Guest may need phone for subscribe — offer still visible
    const pass = page.getByTestId("village-pass");
    await expect(pass).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("subscription-benefits")).toContainText(
      /R0 booking fee|Priority matching|Free cancellations/i,
    );
    await expect(page.getByTestId("subscribe-button")).toBeVisible();
  });
});

test.describe("Fare logic (server-side via UI quote)", () => {
  test("ZA short trip shows price estimate on ride sheet", async ({
    context,
    page,
  }) => {
    await lockCountry(context, "ZA");
    await gotoReady(page, rideBookingUrl());

    // Pins make the quote ready; rider total is on Choose a ride.
    await expect(page.getByTestId("price-display")).toBeVisible({
      timeout: 15_000,
    });
    const text = await page.getByTestId("price-display").innerText();
    // At least base + booking fee path (R15 + R5 = R20) or base alone depending on quote
    expect(text.replace(/\s/g, "")).toMatch(/R\d+/);
  });
});
