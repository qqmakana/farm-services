import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import {
  isProductionBase,
  prepareBrowserContext,
} from "./helpers/auth-helper";
import { assertSafeForDestructiveTests } from "./helpers/cleanup";
import {
  acceptOffer,
  assertWalletCommissionDeducted,
  expectExclusiveOffer,
  goOnlineAsDriver,
  rateRiderIfPrompted,
  startAndCompleteTrip,
} from "./helpers/driver-actions";
import {
  assertCashAndNoSurge,
  bookCashRide,
  expectDriverAssigned,
  expectFindingDriver,
  expectLiveTripMap,
  openRideSheet,
  rateDriver,
} from "./helpers/rider-actions";
import { testLocations, testUsers } from "./helpers/test-data";

/**
 * Uber-style core ride-hailing flow (local mock only).
 *
 * Village Ride auth model: guest rider phone + mock driver select —
 * not email/password fixtures.
 *
 * Run: npx playwright test tests/uber-style-flow.spec.ts
 */
test.describe.serial("Uber-style ride-hailing flow", () => {
  let driverContext: BrowserContext;
  let riderContext: BrowserContext;
  let driver: Page;
  let rider: Page;
  let walletBefore = 0;
  const results: { name: string; ok: boolean }[] = [];

  function track(name: string, ok: boolean) {
    results.push({ name, ok });
  }

  test.beforeAll(async ({ browser, baseURL }) => {
    test.skip(
      isProductionBase(baseURL),
      "Uber-style matching needs local mock store",
    );
    assertSafeForDestructiveTests(baseURL);

    driverContext = await browser.newContext();
    riderContext = await browser.newContext();
    await prepareBrowserContext(driverContext);
    await prepareBrowserContext(riderContext);
    driver = await driverContext.newPage();
    rider = await riderContext.newPage();
  });

  test.afterAll(async () => {
    const passed = results.filter((r) => r.ok).length;
    console.log("\n========== Uber-style flow report ==========");
    for (const r of results) {
      console.log(`  ${r.ok ? "✅" : "❌"} ${r.name}`);
    }
    console.log(`Summary: ${passed}/${results.length} checks passed`);
    console.log("============================================\n");
    await driverContext?.close();
    await riderContext?.close();
  });

  test("1) Driver goes online (system supply for matching)", async () => {
    const setup = await goOnlineAsDriver(driver, testUsers.driver.id);
    walletBefore = setup.walletBefore;
    track("Driver online + FCM ready", true);
  });

  test("2) Rider: map + Where to? + nearby cars (display only)", async () => {
    await openRideSheet(rider);

    await expect(rider.getByText(/Choose a ride/i)).toBeVisible();
    await expect(rider.getByTestId("pickup-input")).toBeVisible();
    await expect(rider.getByTestId("dropoff-input")).toHaveValue(
      new RegExp(testLocations.dropoff, "i"),
    );

    // Nearby cars are Mapbox markers — display only (no choose-driver UI)
    await expect(
      rider.getByRole("button", { name: /Choose this driver|Select car/i }),
    ).toHaveCount(0);

    track("Rider sees map + Where to? (no manual car pick)", true);
  });

  test("3) Payment: cash default, fare estimate, no surge", async () => {
    await assertCashAndNoSurge(rider);
    const price = rider.getByTestId("price-display").first();
    await expect(price).toContainText(/R\s*\d+/i, { timeout: 20_000 });
    await expect(rider.getByText(/surge/i)).toHaveCount(0);
    track("Cash payment + fare estimate + no surge", true);
  });

  test("4) Rider requests → Finding a driver (system matching)", async () => {
    const { tripUrl } = await bookCashRide(rider);
    expect(tripUrl).toMatch(/\/trip\/RU-/i);
    await expectFindingDriver(rider);
    track("Rider booked → Finding your driver", true);
  });

  test("5) Matching: exclusive offer to driver (not rider-chosen)", async () => {
    await expectExclusiveOffer(driver);
    await acceptOffer(driver);
    track("System exclusive offer → driver accepts", true);
  });

  test("6) Trip tracking: driver card, live map, ETA", async () => {
    await expectDriverAssigned(rider, testUsers.driver.name);
    await expectLiveTripMap(rider);

    await expect(rider.getByText(/On the way|Pick-up in/i).first()).toBeVisible();
    await expect(
      rider.getByRole("link", { name: /Message driver/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    track("Rider sees driver + live Mapbox tracking", true);
  });

  test("7) Driver starts + completes trip (cash collected)", async () => {
    await startAndCompleteTrip(driver);
    await rateRiderIfPrompted(driver);
    track("Driver start → complete → cash paid", true);
  });

  test("8) Rider rates driver + wallet commission", async () => {
    await rider.reload();
    await expect(
      rider.getByText(/completed|Done|Rate your driver/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await rateDriver(rider, 5);
    await assertWalletCommissionDeducted(
      driver,
      testUsers.driver.id,
      walletBefore,
    );
    track("Rating + fare/wallet settlement", true);
  });
});

test.describe("Uber-style UI checks (ride sheet)", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Local mock only");
    await prepareBrowserContext(context);
  });

  test("choose-a-ride list + Now/Later + cash CTA", async ({ page }) => {
    await openRideSheet(page);
    await expect(page.getByText(/Choose a ride/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Now$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Later/i })).toBeVisible();
    await expect(page.getByTestId("pay-cash")).toBeVisible();
    await expect(page.getByTestId("book-button").first()).toContainText(
      /Choose/i,
    );
  });
});
