import { test, expect, type Browser, type Page, type BrowserContext } from "@playwright/test";

/**
 * Village Ride — Uber-style end-to-end journey
 *
 * Simulates driver device + customer device (two browser contexts) against
 * the in-memory mock store (VILLAGE_RIDE_USE_MOCK=1).
 *
 * Real UI labels used (not aspirational copy):
 * - Request Delivery · Finding your driver... · Driver Confirmed!
 * - Go Online / ACCEPT · Start Trip · Complete Trip
 * - Wallet = prepaid commission balance (deducts ~15% on complete)
 */

const MTHATHA = { latitude: -31.5833, longitude: 28.7833 };
const DRIVER_NAME = "Thabo Mbeki Bakkie";
const DRIVER_ID = "d1"; // mock-store seed id
const CUSTOMER = {
  name: "E2E Customer",
  phone: "0825550199",
};
const MOCK_FCM = "e2e-mock-fcm-token-village-ride";

async function dismissCountryModalIfPresent(page: Page) {
  // Prefer skipping the first-run country modal entirely
  await page.addInitScript(() => {
    try {
      localStorage.setItem("village_ride_country", "ZA");
      localStorage.setItem("village_ride_country_picked", "1");
    } catch {
      /* ignore */
    }
  });

  const continueBtn = page.getByRole("button", { name: "Continue" });
  if (await continueBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await continueBtn.click({ force: true });
    await expect(continueBtn).toBeHidden({ timeout: 5000 }).catch(() => undefined);
  }
}

async function mockDeviceApis(context: BrowserContext) {
  await context.grantPermissions(["geolocation", "notifications"]);
  await context.setGeolocation(MTHATHA);

  await context.addInitScript(`
    try {
      localStorage.setItem("village_ride_country", "ZA");
      localStorage.setItem("village_ride_country_picked", "1");
    } catch (e) {}
    Object.defineProperty(window.Notification, "permission", {
      configurable: true,
      get: function () { return "granted"; },
    });
    window.Notification.requestPermission = async function () { return "granted"; };
    window.__VILLAGE_RIDE_E2E__ = {
      fcmToken: "e2e-mock-fcm-token-village-ride",
      pushEvents: [],
    };
  `);
}

async function selectDriverAndEnterApp(page: Page) {
  await page.goto("/driver");
  await dismissCountryModalIfPresent(page);

  // Soft driver gate: pick approved mock profile (not email/password auth)
  const select = page.locator("select").first();
  await expect(select).toBeVisible({ timeout: 20_000 });
  await select.selectOption(DRIVER_ID);
  await page.getByRole("button", { name: /Enter driver app/i }).click();
  await page.waitForURL("**/driver/home", { timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Go Online|Go Offline/i })).toBeVisible({
    timeout: 20_000,
  });
}

async function ensureDriverOnline(page: Page) {
  // Test: Driver availability toggle (Uber "Go Online")
  const goOnline = page.getByRole("button", { name: "Go Online" });
  const goOffline = page.getByRole("button", { name: "Go Offline" });

  if (await goOnline.isVisible().catch(() => false)) {
    await goOnline.click();
  }

  await expect(goOffline).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText(/No pending jobs|Stay online|Delivery|Ride|Farm/i).first(),
  ).toBeVisible({ timeout: 10_000 });
}

async function registerMockFcm(page: Page) {
  // Test: FCM token registration (push channel for exclusive offers)
  const res = await page.request.post("/api/e2e/driver", {
    data: { driverId: DRIVER_ID, fcmToken: MOCK_FCM },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.fcm_token).toBe(MOCK_FCM);

  const check = await page.request.get(`/api/e2e/driver?driverId=${DRIVER_ID}`);
  expect(check.ok()).toBeTruthy();
  const state = await check.json();
  expect(state.is_online).toBe(true);
  expect(state.fcm_token).toBe(MOCK_FCM);
}

async function bookVillageDelivery(page: Page) {
  await page.goto("/");
  await dismissCountryModalIfPresent(page);

  // Test: Customer picks a product line (Uber service product)
  await page.getByText("Village Delivery").first().click();
  await page.waitForURL(/\/delivery/);
  await expect(page.getByRole("heading", { name: "Village Delivery" })).toBeVisible();

  await page.getByPlaceholder(/Town hardware store|Village main road/i).fill(
    "Mthatha Taxi Rank",
  );
  await page.getByPlaceholder(/Home address|Village landmark|Town market/i).fill(
    "Qunu Clinic",
  );

  await page.getByLabel("Sender name").fill(CUSTOMER.name);
  await page.getByLabel("Sender phone").fill(CUSTOMER.phone);

  // Medium = Fridge / washing machine
  await page.getByLabel(/What are you sending/i).selectOption("medium");
  await page.getByPlaceholder(/fragile|2nd floor/i).fill("Fridge");

  // Capture fare estimate before request (for wallet math later)
  const estimateEl = page.locator("p.text-2xl.font-bold").first();
  await expect(estimateEl).toBeVisible();
  const estimateText = await estimateEl.innerText();
  const fareMatch = estimateText.replace(/[^\d]/g, "");
  const estimatedFare = fareMatch ? Number(fareMatch) : 0;

  // Test: Instant request → searching state (Uber request ride)
  await page.getByRole("button", { name: "Request Delivery" }).click();
  await page.waitForURL(/\/trip\/RU-/i, { timeout: 20_000 });

  // Test: Real-time dispatch UI — searching overlay
  await expect(page.getByText("Finding your driver...")).toBeVisible({
    timeout: 10_000,
  });

  return { estimatedFare, tripUrl: page.url() };
}

test.describe.serial("Uber-style Village Ride E2E", () => {
  let browser: Browser;
  let driverContext: BrowserContext;
  let customerContext: BrowserContext;
  let driverPage: Page;
  let customerPage: Page;
  let estimatedFare = 0;
  let walletBefore = 0;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    driverContext = await browser.newContext({
      geolocation: MTHATHA,
      permissions: ["geolocation", "notifications"],
    });
    customerContext = await browser.newContext({
      geolocation: MTHATHA,
      permissions: ["geolocation"],
    });
    await mockDeviceApis(driverContext);
    await mockDeviceApis(customerContext);
    driverPage = await driverContext.newPage();
    customerPage = await customerContext.newPage();
  });

  test.afterAll(async () => {
    await driverContext?.close();
    await customerContext?.close();
  });

  test("1) Driver setup — go online + FCM registered", async () => {
    await selectDriverAndEnterApp(driverPage);
    await ensureDriverOnline(driverPage);
    await registerMockFcm(driverPage);

    const state = await driverPage.request.get(
      `/api/e2e/driver?driverId=${DRIVER_ID}`,
    );
    const json = await state.json();
    walletBefore = Number(json.wallet_balance ?? 0);
    expect(json.is_online).toBe(true);
    expect(json.fcm_token).toBe(MOCK_FCM);
  });

  test("2) Customer books Village Delivery — searching then confirmed", async () => {
    const booked = await bookVillageDelivery(customerPage);
    estimatedFare = booked.estimatedFare;

    // Meanwhile: driver should receive exclusive offer (Uber dispatch cascade)
    await driverPage.goto("/driver/home");
    await expect(driverPage.getByRole("button", { name: "ACCEPT" })).toBeVisible({
      timeout: 20_000,
    });
    // Test: Offer card shows this trip's landmarks
    await expect(driverPage.getByText(/Mthatha Taxi Rank/i)).toBeVisible();
    await expect(driverPage.getByText(/Qunu Clinic/i)).toBeVisible();

    // Test: Driver accepts within the offer window
    await driverPage.getByRole("button", { name: "ACCEPT" }).click();

    // Test: Real-time dispatch speed — customer sees confirmed driver ≤ 5–15s
    await expect(
      customerPage.getByText(/Driver Confirmed/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      customerPage.getByText(/Confirmed — driver on the way|on the way/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("3) Driver acceptance — active job en route", async () => {
    // Test: Active trip surfaces on Jobs tab after accept
    await driverPage.goto("/driver/jobs");
    await expect(driverPage.getByText("Current job")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      driverPage.getByText(/Confirmed — driver on the way|Trip in progress/i),
    ).toBeVisible();

    // Start trip → in_progress (Uber "en route / trip started")
    await driverPage.getByRole("button", { name: "Start Trip" }).click();
    await expect(driverPage.getByText(/Trip in progress/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      driverPage.getByRole("button", { name: "Complete Trip" }),
    ).toBeVisible();
  });

  test("4) Trip completion & wallet commission", async () => {
    await driverPage.getByRole("button", { name: "Complete Trip" }).click();

    // Test: History segment shows completed trip
    await driverPage.getByRole("button", { name: /^completed$/i }).click();
    await expect(driverPage.getByText(/Mthatha Taxi Rank/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(driverPage.getByText(/Commission deducted/i)).toBeVisible();

    // Test: Prepaid commission wallet (Village Ride model — not Uber cash-out balance)
    // Completing a trip deducts ~15% platform commission from wallet_balance.
    await driverPage.goto("/driver/earnings");
    await expect(driverPage.getByText("Wallet balance")).toBeVisible();

    const after = await driverPage.request.get(
      `/api/e2e/driver?driverId=${DRIVER_ID}`,
    );
    const json = await after.json();
    const walletAfter = Number(json.wallet_balance ?? 0);
    const owed = Number(json.commission_owed ?? 0);

    // Commission ≈ 15% of fare; wallet decreases (or debt increases) by that amount
    const deducted = walletBefore - walletAfter;
    expect(walletAfter).toBeLessThanOrEqual(walletBefore);
    expect(deducted).toBeGreaterThan(0);
    // Village Ride prepaid wallet: ~15% of trip fee (tolerate night/floor variance)
    if (estimatedFare > 0) {
      const expectedCommission = Math.round((estimatedFare * 15) / 100);
      expect(deducted).toBeGreaterThanOrEqual(Math.max(1, Math.floor(expectedCommission * 0.5)));
      expect(deducted).toBeLessThanOrEqual(expectedCommission + 20);
    }
    // If wallet went negative, commission_owed mirrors the debt
    if (walletAfter < 0) {
      expect(owed).toBeGreaterThan(0);
    }

    // Earnings ledger shows trip + commission lines
    await expect(driverPage.getByText(/Trip RU-/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(driverPage.getByText(/Commission ·/i).first()).toBeVisible();
  });

  test("5) Customer Activity — completed + price", async () => {
    // Guest profile phone powers Activity history
    await customerPage.goto("/activity");
    await dismissCountryModalIfPresent(customerPage);

    // Booking already saved guest profile; if not, enter phone
    const phoneGate = customerPage.getByPlaceholder("063 621 3590");
    if (await phoneGate.isVisible({ timeout: 2500 }).catch(() => false)) {
      await phoneGate.fill(CUSTOMER.phone);
      await customerPage.getByPlaceholder("Your name").fill(CUSTOMER.name);
      await customerPage.getByRole("button", { name: "View my trips" }).click();
    }

    await customerPage.getByRole("button", { name: /^past$/i }).click();

    await expect(customerPage.getByText("Completed").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      customerPage.getByText(/Mthatha Taxi Rank|Qunu Clinic/i).first(),
    ).toBeVisible();
    await expect(customerPage.locator("text=/R\\s?\\d+/").first()).toBeVisible();
  });
});
