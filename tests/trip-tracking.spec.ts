import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  ensureDriverOnline,
  isProductionBase,
  prepareBrowserContext,
  selectMockDriver,
} from "./helpers/auth-helper";
import { generateTestOrder } from "./helpers/data-generators";

test.describe("Trip tracking", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("public trip page after booking shows searching or confirmed", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.skip(isProductionBase(baseURL), "Requires mock booking + driver");

    const driverCtx = await browser.newContext();
    await prepareBrowserContext(driverCtx);
    const driver = await driverCtx.newPage();
    await selectMockDriver(driver, "d1");
    await ensureDriverOnline(driver);

    const order = generateTestOrder();
    await page.goto("/delivery");
    await dismissCountryModalIfPresent(page);
    await page
      .getByPlaceholder(/Town hardware store|Village main road/i)
      .fill(order.pickup);
    await page
      .getByPlaceholder(/Home address|Village landmark|Town market/i)
      .fill(order.dropoff);
    await page.getByLabel("Sender name").fill(order.customerName);
    await page.getByLabel("Sender phone").fill(order.customerPhone);
    await page.getByLabel(/What are you sending/i).selectOption("small");
    await page.getByPlaceholder(/fragile|2nd floor/i).fill(order.item);
    await page.getByRole("button", { name: "Request Delivery" }).click();
    await page.waitForURL(/\/trip\/RU-/i, { timeout: 20_000 });

    await expect(
      page.getByText(/Finding your driver|Driver Confirmed|Track/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Share affordance on trip page
    await expect(
      page.getByText(/Share|copy|WhatsApp|family/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await driverCtx.close();
  });
});
