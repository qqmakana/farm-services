import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Full coverage — villages to cities", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("home search accepts address or landmark wording", async ({ page }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByPlaceholder(/landmark, or address|address/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/Villages, towns|village, town/i).first(),
    ).toBeVisible();
  });

  test("ride form labels address or landmark for pickup and dropoff", async ({
    page,
  }) => {
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/Pickup location \(address or landmark\)/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/Dropoff location \(address or landmark\)/i).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Main Rd|Sandton|Shoprite/i }).first(),
    ).toBeVisible();
  });

  test("courier is not villages-only", async ({ page }) => {
    await page.goto("/courier");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/villages, towns|towns & cities|cities/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
