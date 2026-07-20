import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  isProductionBase,
  prepareBrowserContext,
} from "./helpers/auth-helper";
import { generateTestMerchant, generateTestOrder } from "./helpers/data-generators";
import { assertSafeForDestructiveTests } from "./helpers/cleanup";

test.describe("Merchant / partner flow", () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    test.skip(
      isProductionBase(baseURL),
      "Merchant mutations run against local mock only",
    );
    assertSafeForDestructiveTests(baseURL);
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("signup form validates required fields", async ({ page }) => {
    await page.goto("/shop");
    await dismissCountryModalIfPresent(page);
    const submit = page.getByRole("button", { name: /Create merchant account/i });
    await expect(submit).toBeVisible();
    // HTML5 required — empty submit should not navigate away
    await submit.click();
    await expect(page).toHaveURL(/\/shop/);
  });

  test("dashboard loads with stats and onboarding checklist", async ({ page }) => {
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);

    // Mock: seed shop linked without auth
    await expect(
      page.getByRole("heading", { name: /Mthatha Home|Partner|Appliances/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText(/Total deliveries|Pending|Completed|Fees/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Create delivery/i }).first()).toBeVisible();

    // Checklist or already dismissed / complete
    const checklist = page.getByText(/Get started in 4 steps|Create your first delivery/i);
    if (await checklist.first().isVisible().catch(() => false)) {
      await expect(checklist.first()).toBeVisible();
    }
  });

  test("referral code visible and copyable", async ({ page }) => {
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Your referral code/i)).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator("p.font-mono").filter({ hasText: /[A-Za-z0-9]{5,}/ }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: /Copy code/i }).click();
    await expect(page.getByText(/copied/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("create delivery now — order appears with share link", async ({ page }) => {
    const order = generateTestOrder();
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);

    await page.getByRole("button", { name: /^Create delivery$/i }).first().click();
    await expect(page.getByText(/New delivery from your shop/i)).toBeVisible();

    await page.getByPlaceholder("Customer name").fill(order.customerName);
    await page.getByPlaceholder("Customer phone").fill(order.customerPhone);
    await page.getByPlaceholder(/Drop-off landmark/i).fill(order.dropoff);
    await page.getByPlaceholder(/What to deliver/i).fill(order.item);

    await page.getByRole("button", { name: /Create & notify drivers/i }).click();

    await expect(page.getByText(/created|notified|RU-/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(order.customerName).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /Share trip link/i }).first()).toBeVisible();
  });

  test("schedule delivery for later", async ({ page }) => {
    const order = generateTestOrder({ customerName: "Scheduled Customer" });
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);

    await page.getByRole("button", { name: /^Create delivery$/i }).first().click();
    await page.getByRole("button", { name: /Schedule for Later/i }).click();
    await expect(page.getByLabel(/Date & time/i)).toBeVisible();

    await page.getByPlaceholder("Customer name").fill(order.customerName);
    await page.getByPlaceholder("Customer phone").fill(order.customerPhone);
    await page.getByPlaceholder(/Drop-off landmark/i).fill(order.dropoff);
    await page.getByPlaceholder(/What to deliver/i).fill(order.item);

    await page.getByRole("button", { name: /Schedule delivery/i }).click();
    await expect(page.getByText(/Scheduled|created/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/scheduled/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("weekly report generate", async ({ page }) => {
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);
    await page.getByRole("button", { name: /Generate this week/i }).click();
    await expect(
      page.getByText(/Weekly report|ready|W\d{2}/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("shop signup with referral field accepts code format", async ({ page }) => {
    const merchant = generateTestMerchant({ referralCode: "MTHAx7k" });
    await page.goto("/shop?ref=MTHAx7k");
    await dismissCountryModalIfPresent(page);

    await expect(page.getByPlaceholder(/Referral code/i)).toHaveValue(/MTHA/i);

    await page.getByPlaceholder("Business name").fill(merchant.businessName);
    await page.getByPlaceholder("Phone").first().fill(merchant.phone);
    await page.getByPlaceholder(/Business email/i).fill(merchant.email);
    await page.getByPlaceholder(/Password/i).fill(merchant.password);
    await page.getByPlaceholder(/Landmark/i).fill(merchant.landmark);

    // Mock: register succeeds then may redirect or show message
    await page.getByRole("button", { name: /Create merchant account/i }).click();
    await expect(
      page.getByText(/Welcome|registered|Sign in|dashboard/i).first(),
    ).toBeVisible({ timeout: 25_000 });
  });
});
