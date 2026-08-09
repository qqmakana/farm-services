import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { dismissCountryModalIfPresent } from "./helpers/auth-helper";
import { calculateUnifiedFare } from "../src/lib/pricing";
import {
  cashPlatformRemittance,
  cardDriverPayout,
  driverEligibleForDispatch,
  WALLET_ONLINE_FLOOR,
} from "../src/lib/wallet";
import { VILLAGE_PASS_BOOKING_FEE_ZAR } from "../src/lib/village-pass";
import type { ServiceType } from "../src/lib/types";
import type { WeightCategory } from "../src/lib/pricing";

/**
 * Comprehensive validation — adapted to the *actual* Village Ride build.
 *
 * Pricing accuracy is asserted via `calculateUnifiedFare` (source of truth).
 * UI checks use real data-testids (no window.mockDistance / Inter / black CTA).
 *
 * Totals = base + (per_km × distance) + platform fee (R5), unless Village Pass.
 * Ride/Courier also enforce minimum driver fare R25 before the fee.
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

async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await dismissCountryModalIfPresent(page);
}

function digitsOnly(s: string) {
  return s.replace(/[^\d]/g, "");
}

// ============================================
// PRICING ACCURACY (unit — no UI mocks)
// ============================================

test.describe("Pricing Accuracy - All Services & Weight Categories", () => {
  const cases: Array<{
    service: ServiceType;
    distance: number;
    weight: WeightCategory | null;
    expectedBase: number;
    expectedPerKm: number;
    /** Rider total including R5 platform fee */
    expectedTotal: number;
  }> = [
    // Ride (no weight) — total includes R5 fee
    {
      service: "ride",
      distance: 5,
      weight: null,
      expectedBase: 15,
      expectedPerKm: 10,
      expectedTotal: 70, // 15+50+5
    },
    {
      service: "ride",
      distance: 10,
      weight: null,
      expectedBase: 15,
      expectedPerKm: 10,
      expectedTotal: 120, // 15+100+5
    },
    {
      service: "ride",
      distance: 20,
      weight: null,
      expectedBase: 15,
      expectedPerKm: 10,
      expectedTotal: 220, // 15+200+5
    },
    // Courier (no weight)
    {
      service: "courier",
      distance: 5,
      weight: null,
      expectedBase: 15,
      expectedPerKm: 10,
      expectedTotal: 70,
    },
    {
      service: "courier",
      distance: 10,
      weight: null,
      expectedBase: 15,
      expectedPerKm: 10,
      expectedTotal: 120,
    },
    // Delivery bands @ 10km
    {
      service: "delivery",
      distance: 10,
      weight: "light",
      expectedBase: 20,
      expectedPerKm: 12,
      expectedTotal: 145,
    },
    {
      service: "delivery",
      distance: 10,
      weight: "medium",
      expectedBase: 35,
      expectedPerKm: 15,
      expectedTotal: 190,
    },
    {
      service: "delivery",
      distance: 10,
      weight: "heavy",
      expectedBase: 60,
      expectedPerKm: 20,
      expectedTotal: 265,
    },
    {
      service: "delivery",
      distance: 10,
      weight: "extra_heavy",
      expectedBase: 100,
      expectedPerKm: 30,
      expectedTotal: 405,
    },
    // Farm bands @ 10km
    {
      service: "farm",
      distance: 10,
      weight: "light",
      expectedBase: 25,
      expectedPerKm: 15,
      expectedTotal: 180,
    },
    {
      service: "farm",
      distance: 10,
      weight: "medium",
      expectedBase: 40,
      expectedPerKm: 18,
      expectedTotal: 225,
    },
    {
      service: "farm",
      distance: 10,
      weight: "heavy",
      expectedBase: 70,
      expectedPerKm: 25,
      expectedTotal: 325,
    },
    {
      service: "farm",
      distance: 10,
      weight: "extra_heavy",
      expectedBase: 120,
      expectedPerKm: 35,
      expectedTotal: 475, // 120+350+5
    },
  ];

  for (const c of cases) {
    test(`${c.service} ${c.weight ?? "n/a"} ${c.distance}km → R${c.expectedTotal}`, () => {
      const fare = calculateUnifiedFare({
        serviceType: c.service,
        distanceKm: c.distance,
        weightCategory: c.weight,
        countryCode: "ZA",
        isSubscribed: false,
      });
      expect(fare.base_fare).toBe(c.expectedBase);
      expect(fare.distance_fare).toBe(c.expectedPerKm * c.distance);
      expect(fare.platform_fee).toBe(VILLAGE_PASS_BOOKING_FEE_ZAR);
      expect(fare.total_fare).toBe(c.expectedTotal);
    });
  }

  test("enforces minimum driver fare R25 on short ride (then +R5 fee)", () => {
    const fare = calculateUnifiedFare({
      serviceType: "ride",
      distanceKm: 1,
      countryCode: "ZA",
      isSubscribed: false,
    });
    // 15+10=25 → already at min; total 30 with fee
    expect(fare.driver_fare).toBe(25);
    expect(fare.total_fare).toBe(30);
  });

  test("0km ride still hits minimum fare R25 + fee", () => {
    const fare = calculateUnifiedFare({
      serviceType: "ride",
      distanceKm: 0,
      countryCode: "ZA",
      isSubscribed: false,
    });
    expect(fare.driver_fare).toBe(25);
    expect(fare.total_fare).toBe(30);
  });

  test("negative distance treated as 0km", () => {
    const fare = calculateUnifiedFare({
      serviceType: "ride",
      distanceKm: -5,
      countryCode: "ZA",
      isSubscribed: false,
    });
    expect(fare.distance_km).toBe(0);
    expect(fare.driver_fare).toBe(25);
  });
});

// ============================================
// PAYMENT SCENARIOS (wallet math)
// ============================================

test.describe("Payment Flow - Cash, Card, Village Pass", () => {
  test("Cash: deduct platform fee only from driver wallet", () => {
    const remit = cashPlatformRemittance({
      fee_amount: 120,
      booking_fee: 5,
      platform_commission: 0,
      driver_payout: 115,
      base_fare: 15,
    });
    expect(remit).toBe(5);
  });

  test("Card: credit driver (total − platform fee)", () => {
    const payout = cardDriverPayout({
      fee_amount: 120,
      booking_fee: 5,
      platform_commission: 0,
      driver_payout: 115,
      base_fare: 15,
    });
    expect(payout).toBe(115);
  });

  test("Village Pass: platform fee R0; cash remittance 0", () => {
    const fare = calculateUnifiedFare({
      serviceType: "ride",
      distanceKm: 10,
      countryCode: "ZA",
      isSubscribed: true,
    });
    expect(fare.platform_fee).toBe(0);
    expect(fare.total_fare).toBe(115); // driver only
    expect(fare.driver_fare).toBe(115);

    const remit = cashPlatformRemittance({
      fee_amount: fare.total_fare,
      booking_fee: 0,
      platform_commission: 0,
      driver_payout: fare.driver_fare,
      village_pass: true,
    });
    expect(remit).toBe(0);
  });

  test("legacy job without flat-fee fields still uses ~10%", () => {
    const remit = cashPlatformRemittance({
      fee_amount: 400,
      // booking_fee defaults to 0 on mock create, but no driver_payout/base_fare
    });
    expect(remit).toBe(40);
  });
});

// ============================================
// UI: weight + checkout (real selectors)
// ============================================

test.describe("Delivery / Farm weight UI", () => {
  test.beforeEach(async ({ context }) => {
    await lockCountry(context, "ZA");
  });

  test("delivery shows weight categories + fare breakdown", async ({ page }) => {
    await gotoReady(page, "/delivery");

    await expect(page.getByTestId("weight-light")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("weight-medium")).toBeVisible();
    await expect(page.getByTestId("weight-heavy")).toBeVisible();
    await expect(page.getByTestId("weight-extra_heavy")).toBeVisible();

    await page.getByTestId("weight-heavy").click();
    await expect(page.getByTestId("fare-breakdown")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("base-fare")).toBeVisible();
    await expect(page.getByTestId("platform-fee")).toBeVisible();
    await expect(page.getByTestId("total-fare")).toBeVisible();

    // Medium default base is 35; heavy should show higher base (60) once quote settles
    await expect
      .poll(async () => digitsOnly(await page.getByTestId("base-fare").innerText()), {
        timeout: 15_000,
      })
      .toContain("60");
  });

  test("farm shows weight categories + fare breakdown", async ({ page }) => {
    await gotoReady(page, "/farm");

    await expect(page.getByTestId("weight-light")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("weight-medium").click();
    await expect(page.getByTestId("fare-breakdown")).toBeVisible();
    await expect
      .poll(async () => digitsOnly(await page.getByTestId("base-fare").innerText()), {
        timeout: 15_000,
      })
      .toContain("40");
  });

  test("courier has no weight category selector", async ({ page }) => {
    await gotoReady(page, "/courier");
    await expect(page.getByText(/Village Courier|Courier/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("weight-light")).toHaveCount(0);
  });
});

test.describe("Checkout payment selector UI", () => {
  test.beforeEach(async ({ context }) => {
    await lockCountry(context, "ZA");
  });

  test("cash default + card selectable; Village Pass offer present", async ({
    page,
  }) => {
    await gotoReady(page, "/ride");

    await page.getByTestId("pickup-input").fill("Clinic gate");
    await page.getByTestId("dropoff-input").fill("Town market");
    await page.getByLabel(/Your name/i).fill("QA Rider");
    await page.getByLabel(/^Phone$/i).fill("0821234567");
    await page.keyboard.press("Escape");

    await expect(page.getByTestId("payment-selector")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("pay-cash")).toHaveAttribute(
      "data-selected",
      "true",
    );
    await expect(page.getByTestId("cash-payment-message")).toContainText(
      /Pay the driver in cash|platform fee/i,
    );

    await page.getByTestId("pay-card").click();
    await expect(page.getByTestId("pay-card")).toHaveAttribute(
      "data-selected",
      "true",
    );

    await expect(page.getByTestId("village-pass")).toBeVisible();
  });
});

// ============================================
// UBER-LIKE UI (actual brand: green CTA, Source Sans)
// ============================================

test.describe("Uber-Style UI/UX Quality Checks", () => {
  test.beforeEach(async ({ context }) => {
    await lockCountry(context, "ZA");
  });

  test("full-bleed map + floating search + bottom sheet", async ({ page }) => {
    await gotoReady(page, "/ride");

    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".leaflet-control-zoom")).toHaveCount(0);

    await expect(page.getByTestId("search-bar")).toBeVisible();
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId("drag-handle")).toBeVisible();

    const radius = await sheet.evaluate((el) =>
      getComputedStyle(el).borderTopLeftRadius,
    );
    expect(parseFloat(radius)).toBeGreaterThanOrEqual(16);
  });

  test("Book CTA is brand green (#0ECB81), not black Uber clone", async ({
    page,
  }) => {
    await gotoReady(page, "/ride");
    const book = page.getByTestId("book-button").first();
    await expect(book).toBeVisible({ timeout: 15_000 });
    const bg = await book.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(14,\s*203,\s*129\)/);
  });

  test("uses Source Sans / Space Grotesk (not Inter)", async ({ page }) => {
    await gotoReady(page, "/ride");
    const font = await page.locator("body").evaluate((el) =>
      getComputedStyle(el).fontFamily,
    );
    expect(font.toLowerCase()).not.toContain("inter");
    expect(
      /source|grotesk|sans/i.test(font),
    ).toBeTruthy();
  });
});

// ============================================
// MULTI-COUNTRY
// ============================================

test.describe("Multi-Country Support", () => {
  const markets = [
    { code: "ZA", currency: "ZAR", baseDigits: "15" },
    { code: "NG", currency: "NGN", baseDigits: "1500" },
    { code: "KE", currency: "KES", baseDigits: "300" },
    { code: "IN", currency: "INR", baseDigits: "100" },
    { code: "BR", currency: "BRL", baseDigits: "15" },
  ] as const;

  for (const m of markets) {
    test(`locks ${m.code} currency + ride base`, async ({ context, page }) => {
      await lockCountry(context, m.code);
      await gotoReady(page, "/ride");

      const indicator = page.getByTestId("country-indicator");
      await expect(indicator).toBeVisible({ timeout: 15_000 });
      await expect(indicator).toContainText(m.currency);

      const body = await page.locator("body").innerText();
      expect(digitsOnly(body).includes(m.baseDigits)).toBeTruthy();
    });
  }

  test("scaled NG delivery light base from ZA bands", () => {
    const fare = calculateUnifiedFare({
      serviceType: "delivery",
      distanceKm: 0,
      weightCategory: "light",
      countryCode: "NG",
      isSubscribed: false,
    });
    // ZA light base 20 × (1500/15) = 2000
    expect(fare.base_fare).toBe(2000);
    expect(fare.currency).toBe("NGN");
  });
});

// ============================================
// WALLET / EDGE
// ============================================

test.describe("Wallet edge cases — post-paid −R100", () => {
  test("dispatch blocked below −R100 credit limit", () => {
    expect(WALLET_ONLINE_FLOOR).toBe(-100);
    expect(driverEligibleForDispatch({ wallet_balance: 0 })).toBe(true);
    expect(driverEligibleForDispatch({ wallet_balance: -100 })).toBe(true);
    expect(driverEligibleForDispatch({ wallet_balance: -101 })).toBe(false);
  });
});

// ============================================
// PERFORMANCE (soft thresholds for local/CI)
// ============================================

test.describe("Performance & Load Time", () => {
  test("ride map visible within 8s", async ({ context, page }) => {
    await lockCountry(context, "ZA");
    const start = Date.now();
    await gotoReady(page, "/ride");
    await page.locator(".leaflet-container").waitFor({ state: "visible" });
    expect(Date.now() - start).toBeLessThan(8_000);
  });

  test("unified fare calc is sync & under 50ms", () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      calculateUnifiedFare({
        serviceType: "delivery",
        distanceKm: 10,
        weightCategory: "medium",
        countryCode: "ZA",
      });
    }
    expect(Date.now() - start).toBeLessThan(50);
  });
});
