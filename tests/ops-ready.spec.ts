import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  isProductionBase,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Production readiness surfaces", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Simple pricing/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Keep ~85%|FREE signup/i).first()).toBeVisible();
  });

  test("driver join recruitment page", async ({ page, baseURL }) => {
    await page.goto("/driver/join");
    await expect(
      page.getByRole("heading", { name: /Earn money with your vehicle/i }),
    ).toBeVisible({ timeout: 15_000 });
    if (isProductionBase(baseURL)) {
      await expect(page.getByRole("button", { name: /Apply to drive/i })).toBeVisible();
      return;
    }
    await page.getByPlaceholder("Full name").fill("E2E Applicant");
    await page.getByPlaceholder(/Phone/i).fill("0825550199");
    await page.getByRole("button", { name: /Apply to drive/i }).click();
    await expect(page.getByText(/Application received/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("admin dashboard accessible in mock", async ({ page, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock-only admin");
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: /Admin dashboard/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Merchants|Revenue/i).first()).toBeVisible();
  });

  test("health endpoint ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBeTruthy();
    expect(json.service).toBe("village-ride");
  });

  test("merchant can cancel an order", async ({ page, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock-only");
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);
    await page.getByRole("button", { name: /^Create delivery$/i }).first().click();
    await page.getByLabel(/Customer name/i).fill("Cancel Me");
    await page.getByLabel(/Customer phone/i).fill("0825550100");
    await page.getByLabel(/Where to/i).fill("Qunu");
    await page.getByLabel(/What to deliver/i).fill("Box");
    await page.getByRole("button", { name: /Request delivery/i }).click();
    await expect(page.getByText(/Cancel Me/i).first()).toBeVisible({ timeout: 15_000 });

    page.once("dialog", async (dialog) => {
      await dialog.accept("customer_changed_mind");
    });
    await page.getByRole("button", { name: /Cancel order/i }).first().click();
    await expect(page.getByText(/Cancelled/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("admin errors page filters", async ({ page, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock-only admin");
    await page.goto("/admin/errors");
    await expect(page.getByRole("heading", { name: /Error inbox/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: /^Filter$/i })).toBeVisible();
  });
});
