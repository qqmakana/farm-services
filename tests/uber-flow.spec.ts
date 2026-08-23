import { test, expect, type Browser, type Page, type BrowserContext } from "@playwright/test";

/**
 * Village Ride — Uber-style end-to-end journey
 *
 * Simulates driver device + customer device (two browser contexts) against
 * the in-memory mock store (VILLAGE_RIDE_USE_MOCK=1).
 */

const MTHATHA = { latitude: -31.5833, longitude: 28.7833 };
const DRIVER_ID = "d1"; // mock-store seed id
const CUSTOMER = {
  name: "E2E Customer",
  phone: "0825550199",
};
const MOCK_FCM = "e2e-mock-fcm-token-village-ride";

async function dismissCountryModalIfPresent(page: Page) {
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
      localStorage.setItem("vr_driver_onboarding_seen_v1", "1");
      localStorage.setItem("vr_feature_tour_seen_v3", "1");
      localStorage.setItem("vr_onboarding_seen_v1", "1");
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

  const select = page.locator("select").first();
  await expect(select).toBeVisible({ timeout: 20_000 });
  await select.selectOption(DRIVER_ID);
  await page.getByRole("button", { name: /Enter driver app/i }).click();

  const skip = page.getByRole("button", { name: /^Skip$/i });
  if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skip.click();
  }

  await page.waitForURL("**/driver/home", { timeout: 20_000 });
  await expect(page.getByRole("button", { name: /^(ONLINE|OFFLINE)$/i })).toBeVisible({
    timeout: 20_000,
  });
}

async function ensureDriverOnline(page: Page) {
  const notNow = page.getByRole("button", { name: /Not now/i });
  if (await notNow.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await notNow.click();
  }

  const offline = page.getByRole("button", { name: /^OFFLINE$/i });
  if (await offline.isVisible().catch(() => false)) {
    await offline.click();
  }

  await expect(page.getByRole("button", { name: /^ONLINE$/i })).toBeVisible({
    timeout: 15_000,
  });
}

async function registerMockFcm(page: Page) {
  // Reset wallet so serial retries / prior trips don't leave negative balance
  const res = await page.request.post("/api/e2e/driver", {
    data: {
      driverId: DRIVER_ID,
      fcmToken: MOCK_FCM,
      isOnline: true,
      walletBalance: 500,
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.fcm_token).toBe(MOCK_FCM);

  const check = await page.request.get(`/api/e2e/driver?driverId=${DRIVER_ID}`);
  expect(check.ok()).toBeTruthy();
  const state = await check.json();
  expect(state.is_online).toBe(true);
  expect(state.fcm_token).toBe(MOCK_FCM);
  expect(Number(state.wallet_balance)).toBeGreaterThanOrEqual(0);
}

async function bookVillageDelivery(page: Page) {
  await page.goto("/delivery");
  await dismissCountryModalIfPresent(page);
  await expect(
    page.getByRole("heading", { name: /Village Delivery/i }),
  ).toBeVisible({
    timeout: 15_000,
  });

  const pickup = page.getByPlaceholder("Pickup — sender meets driver");
  const dropoff = page.getByPlaceholder("Drop-off — recipient address");
  await expect(pickup).toBeVisible({ timeout: 15_000 });
  await pickup.fill("Mthatha Taxi Rank");
  await dropoff.fill("Qunu Clinic");

  await page.getByLabel("Sender name").fill(CUSTOMER.name);
  await page.getByLabel("Sender phone").fill(CUSTOMER.phone);

  await page
    .getByPlaceholder("e.g. sealed box, microwave, building sand")
    .fill("Fridge");

  // Weight categories are Uber-style chips (not a <select>)
  await page.getByTestId("weight-medium").click();
  await page
    .getByPlaceholder(
      "e.g. 2nd floor, fragile. Driver photos load at pickup and drop-off.",
    )
    .fill("Handle with care");

  // Confirm React state picked up landmark text
  await expect(pickup).toHaveValue(/Mthatha/i);
  await expect(dropoff).toHaveValue(/Qunu/i);

  const estimateEl = page.getByTestId("price-display");
  await expect(estimateEl).toBeVisible();
  const estimateText = await estimateEl.innerText();
  const fareMatch = estimateText.replace(/[^\d]/g, "");
  const estimatedFare = fareMatch ? Number(fareMatch) : 0;

  // Close any places suggestion list that can intercept the click
  await page.keyboard.press("Escape");
  const requestBtn = page.getByRole("button", { name: /Request Delivery/i });
  await expect(requestBtn).toBeEnabled({ timeout: 15_000 });
  await requestBtn.scrollIntoViewIfNeeded();
  await requestBtn.click();

  // Prefer URL change; if stuck, surface form error for debugging
  try {
    await page.waitForURL(/\/trip\/RU-/i, { timeout: 30_000 });
  } catch {
    const err = await page
      .locator(".text-rose-800, [class*='rose']")
      .first()
      .textContent()
      .catch(() => null);
    throw new Error(
      `Booking did not navigate to /trip. Form error: ${err ?? "(none)"}. URL=${page.url()}`,
    );
  }

  await expect(
    page.getByText(/Finding your driver|Confirmed|On the way|Searching/i).first(),
  ).toBeVisible({ timeout: 10_000 });

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

    await driverPage.goto("/driver/home");
    await expect(driverPage.getByRole("button", { name: "ACCEPT" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(driverPage.getByText(/Mthatha Taxi Rank/i)).toBeVisible();
    await expect(driverPage.getByText(/Qunu Clinic/i)).toBeVisible();

    await driverPage.getByRole("button", { name: "ACCEPT" }).click();

    await expect(
      customerPage.getByText(/Confirmed — driver on the way|On the way|driver on the way/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("3) Driver acceptance — active job en route", async () => {
    await driverPage.goto("/driver/jobs");
    await expect(driverPage.getByText("Current job")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      driverPage.getByText(/Confirmed — driver on the way|Trip in progress|on the way/i).first(),
    ).toBeVisible();

    await driverPage.getByRole("button", { name: /I'?ve arrived/i }).click();
    await expect(
      driverPage.getByText(/Arrived at pickup/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await driverPage.getByRole("button", { name: "Start Trip" }).click();
    await expect(driverPage.getByText(/Trip in progress|In progress/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      driverPage.getByRole("button", { name: "Complete Trip" }),
    ).toBeVisible();
  });

  test("4) Trip completion & wallet commission", async () => {
    await driverPage.getByRole("button", { name: "Complete Trip" }).click();
    await driverPage
      .getByRole("button", { name: /Yes — paid|Yes - paid|paid/i })
      .first()
      .click();

    await driverPage.getByRole("button", { name: /^completed$/i }).click();
    await expect(driverPage.getByText(/Mthatha Taxi Rank/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      driverPage.getByText(/Commission deducted|completed|RU-/i).first(),
    ).toBeVisible();

    await driverPage.goto("/driver/earnings");
    await expect(
      driverPage.getByText(/Commission wallet|Earnings|Wallet/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    const after = await driverPage.request.get(
      `/api/e2e/driver?driverId=${DRIVER_ID}`,
    );
    const json = await after.json();
    const walletAfter = Number(json.wallet_balance ?? 0);
    const owed = Number(json.commission_owed ?? 0);

    const deducted = walletBefore - walletAfter;
    expect(walletAfter).toBeLessThan(walletBefore);
    expect(deducted).toBeGreaterThan(0);
    // UI estimate can differ from charged fee (floors / night) — keep a loose bound
    if (estimatedFare > 0) {
      const expectedCommission = Math.round((estimatedFare * 15) / 100);
      expect(deducted).toBeLessThanOrEqual(Math.max(expectedCommission + 40, 80));
    }
    if (walletAfter < 0) {
      expect(owed).toBeGreaterThan(0);
    }

    await expect(
      driverPage.getByText(/Cash from customer|Trip RU-|RU-/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      driverPage.getByText(/Platform ~10%|Commission/i).first(),
    ).toBeVisible();
  });

  test("5) Customer Activity — completed + price", async () => {
    await customerPage.goto("/activity");
    await dismissCountryModalIfPresent(customerPage);

    const phoneGate = customerPage.getByPlaceholder(/063|phone/i).first();
    if (await phoneGate.isVisible({ timeout: 2500 }).catch(() => false)) {
      await phoneGate.fill(CUSTOMER.phone);
      const name = customerPage.getByPlaceholder(/Your name|name/i).first();
      if (await name.isVisible().catch(() => false)) {
        await name.fill(CUSTOMER.name);
      }
      const view = customerPage.getByRole("button", {
        name: /View activity|View my trips|Show/i,
      });
      await expect(view).toBeVisible({ timeout: 5_000 });
      await view.click();
    }

    const past = customerPage.getByRole("button", { name: /Past/i });
    if (await past.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await past.click();
    }

    await expect(
      customerPage.getByText(/Qunu Clinic|Mthatha Taxi Rank/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      customerPage.getByText(/Completed/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(customerPage.getByTestId("trip-fare").first()).toBeVisible();
    await expect(customerPage.getByTestId("trip-fare").first()).toContainText(
      /\d/,
    );
  });
});
