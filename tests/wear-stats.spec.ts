import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";
import { testLocations, testUsers } from "./helpers/test-data";
import { isProductionBase } from "./helpers/auth-helper";

test.describe("Wear stats & wearing field", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("wear-stats page loads with brand rankings UI", async ({ page }) => {
    await page.goto("/wear-stats");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByRole("heading", { name: /wearing|Wear/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Brand rankings|Wear of the Week|Ready to post/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Copy for social/i }),
    ).toBeVisible();
  });

  test("ride booking shows What are you wearing field", async ({ page }) => {
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/What are you wearing/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await page
      .getByPlaceholder(/Nike tracksuit|red jacket/i)
      .fill(testLocations.wearing);
  });

  test("local mock: wearing flows into cash booking draft", async ({
    page,
    baseURL,
  }) => {
    test.skip(
      isProductionBase(baseURL),
      "Booking write against production skipped",
    );

    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);

    const pickup = page
      .getByLabel(/Describe your pickup|Pickup/i)
      .or(page.getByPlaceholder(/mango tree|landmark|Pickup/i))
      .first();
    await pickup.fill(testLocations.pickup);

    const dropoff = page
      .getByLabel(/Describe your dropoff|Dropoff/i)
      .or(page.getByPlaceholder(/church|Dropoff|Clinic/i))
      .first();
    await dropoff.fill(testLocations.dropoff);

    await page.getByLabel(/Your name/i).fill(testUsers.rider.name);
    await page.getByLabel(/^Phone$/i).fill(testUsers.rider.phone);
    await page
      .getByPlaceholder(/Nike tracksuit|red jacket/i)
      .fill(testLocations.wearing);

    await expect(page.getByRole("button", { name: /Request Ride/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
