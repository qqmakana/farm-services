import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Public pages", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("homepage loads with Village Ride brand", async ({ page }) => {
    const started = Date.now();
    await page.goto("/");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Village Ride|Sandton Streets/i).first()).toBeVisible({
      timeout: 20_000,
    });
    expect(Date.now() - started).toBeLessThan(15_000);
  });

  test("partners page — For Businesses marketing", async ({ page }) => {
    await page.goto("/partners");
    await expect(
      page.getByRole("heading", {
        name: /Deliveries for your shop|For Businesses|Partners/i,
      }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /Sign up free|Create partner/i }).first()).toBeVisible();
    await expect(page.getByText(/15%|commission|Free signup/i).first()).toBeVisible();
  });

  test("help FAQ page loads", async ({ page }) => {
    await page.goto("/help");
    await expect(page.getByRole("heading", { name: /Help|FAQ/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/commission|referral|track/i).first()).toBeVisible();
  });

  test("shop / partner signup page loads", async ({ page }) => {
    await page.goto("/shop");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByRole("heading", { name: /Shop or farm|Register|merchant/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByPlaceholder(/Business name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Business email/i)).toBeVisible();
  });

  test("trip tracking — invalid code shows graceful state", async ({ page }) => {
    await page.goto("/trip/RU-NOPE");
    await dismissCountryModalIfPresent(page);
    // Live trip or not-found messaging — must not crash
    await expect(page.locator("body")).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
  });

  test("nav includes Partners link", async ({ page }) => {
    await page.goto("/partners");
    await expect(page.getByRole("link", { name: "Partners" }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
