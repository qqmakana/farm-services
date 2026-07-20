import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  ensureDriverOnline,
  isProductionBase,
  prepareBrowserContext,
  selectMockDriver,
} from "./helpers/auth-helper";
import { generateTestOrder } from "./helpers/data-generators";
import { assertSafeForDestructiveTests } from "./helpers/cleanup";

const DRIVER_ID = "d1";
const MOCK_FCM = "e2e-driver-flow-fcm";

test.describe.serial("Driver flow", () => {
  let context: BrowserContext;
  let page: Page;
  let customer: Page;
  let customerContext: BrowserContext;
  let walletBefore = 0;

  test.beforeAll(async ({ browser, baseURL }) => {
    test.skip(
      isProductionBase(baseURL),
      "Driver mutations run against local mock only",
    );
    assertSafeForDestructiveTests(baseURL);

    context = await browser.newContext();
    customerContext = await browser.newContext();
    await prepareBrowserContext(context);
    await prepareBrowserContext(customerContext);
    page = await context.newPage();
    customer = await customerContext.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
    await customerContext?.close();
  });

  test("enter app, go online, register FCM", async () => {
    await selectMockDriver(page, DRIVER_ID);
    await ensureDriverOnline(page);

    const res = await page.request.post("/api/e2e/driver", {
      data: {
        driverId: DRIVER_ID,
        fcmToken: MOCK_FCM,
        walletBalance: 500,
        isOnline: true,
      },
    });
    expect(res.ok()).toBeTruthy();

    const state = await page.request.get(`/api/e2e/driver?driverId=${DRIVER_ID}`);
    const json = await state.json();
    expect(json.is_online).toBe(true);
    expect(json.fcm_token).toBe(MOCK_FCM);
    walletBefore = Number(json.wallet_balance ?? 0);
  });

  test("receive offer, accept, start, complete — commission deducted", async () => {
    const order = generateTestOrder();

    await customer.goto("/delivery");
    await dismissCountryModalIfPresent(customer);
    await customer
      .getByPlaceholder(/Town hardware store|Village main road/i)
      .fill(order.pickup);
    await customer
      .getByPlaceholder(/Home address|Village landmark|Town market/i)
      .fill(order.dropoff);
    await customer.getByLabel("Sender name").fill(order.customerName);
    await customer.getByLabel("Sender phone").fill(order.customerPhone);
    await customer.getByLabel(/What are you sending/i).selectOption(order.size);
    await customer.getByPlaceholder(/fragile|2nd floor/i).fill(order.item);
    await customer.getByRole("button", { name: "Request Delivery" }).click();
    await customer.waitForURL(/\/trip\/RU-/i, { timeout: 20_000 });

    await page.goto("/driver/home");
    await expect(page.getByRole("button", { name: "ACCEPT" })).toBeVisible({
      timeout: 25_000,
    });
    await page.getByRole("button", { name: "ACCEPT" }).click();

    await page.goto("/driver/jobs");
    await expect(page.getByRole("button", { name: "Start Trip" })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Start Trip" }).click();
    await expect(page.getByRole("button", { name: "Complete Trip" })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Complete Trip" }).click();

    await page.getByRole("button", { name: /^completed$/i }).click();
    await expect(page.getByText(/Commission deducted/i)).toBeVisible({
      timeout: 15_000,
    });

    // Optional rate customer UI
    const rateBtn = page.getByRole("button", { name: /Rate customer|Submit rating|★/i });
    if (await rateBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await rateBtn.first().click();
    }

    await page.goto("/driver/earnings");
    await expect(page.getByText("Wallet balance")).toBeVisible();

    const after = await page.request.get(`/api/e2e/driver?driverId=${DRIVER_ID}`);
    const json = await after.json();
    expect(Number(json.wallet_balance ?? 0)).toBeLessThanOrEqual(walletBefore);
  });

  test("jobs and earnings pages load", async () => {
    await page.goto("/driver/jobs");
    await expect(page.getByText(/Current job|History|Jobs/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/driver/earnings");
    await expect(page.getByText(/Wallet|commission|earnings/i).first()).toBeVisible();
  });
});
