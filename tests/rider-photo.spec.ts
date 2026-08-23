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
    await expect(page.getByText(/^Upload$/i).first()).toBeVisible();

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await page
      .locator('input[type="file"]:not([capture])')
      .first()
      .setInputFiles({
        name: "face.png",
        mimeType: "image/png",
        buffer: png,
      });

    await expect(page.getByAltText("Your photo")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/Could not read that photo/i),
    ).toHaveCount(0);
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
