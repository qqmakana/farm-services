import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Rider photo", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("account shows Add photo with privacy note", async ({ page }) => {
    await page.goto("/account");
    await dismissCountryModalIfPresent(page);

    // Ensure a guest profile exists so photo field appears.
    await page.evaluate(() => {
      localStorage.setItem(
        "village_ride_guest_profile",
        JSON.stringify({
          name: "Photo Rider",
          phone: "0825550199",
          country_code: "ZA",
        }),
      );
    });
    await page.reload();
    await dismissCountryModalIfPresent(page);

    await expect(page.getByText(/Your photo/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/only shared with your driver/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/Add photo|Change/i).first()).toBeVisible();
  });

  test("ride booking shows optional rider photo next to wearing", async ({
    page,
  }) => {
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);

    // Uber-compact sheet: wearing + photo live under More options
    const more = page.getByRole("button", { name: /More options/i });
    if (await more.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await more.click();
    }

    await expect(
      page.getByText(/What are you wearing/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Your photo/i).first()).toBeVisible();
    await expect(
      page.getByText(/only shared with your driver/i).first(),
    ).toBeVisible();
  });
});
