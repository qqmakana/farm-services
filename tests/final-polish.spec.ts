import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
  selectMockDriver,
} from "./helpers/auth-helper";

test.describe("Final polish", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("help page has WhatsApp + email support CTAs", async ({ page }) => {
    await page.goto("/help");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByRole("heading", { name: /Help/i })).toBeVisible({
      timeout: 15_000,
    });
    const wa = page.locator('a[href*="wa.me/27636213590"]').first();
    const email = page.locator('a[href^="mailto:ai@sandtonstreets.com"]').first();
    await expect(wa).toBeVisible();
    await expect(email).toBeVisible();
  });

  test("home map chrome exposes Help", async ({ page }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByRole("link", { name: "Help" }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("account shows referral share card when guest profile exists", async ({
    page,
  }) => {
    await page.goto("/account");
    await dismissCountryModalIfPresent(page);
    await page.evaluate(() => {
      localStorage.setItem(
        "village_ride_guest_profile",
        JSON.stringify({
          name: "Test Rider",
          phone: "0821234567",
          country_code: "ZA",
        }),
      );
    });
    await page.reload();
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Refer a friend/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/R50/i).first()).toBeVisible();
    await expect(
      page.locator("a[href*='wa.me'], a[href*='whatsapp']").first(),
    ).toBeVisible();
  });

  test("activity page loads trip history", async ({ page }) => {
    await page.goto("/activity");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByRole("heading", { name: /Activity/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("driver earnings shows period tabs and weekly incentive", async ({
    page,
  }) => {
    await selectMockDriver(page);
    await page.goto("/driver/earnings");
    await expect(page.getByRole("heading", { name: /Earnings/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This week" })).toBeVisible();
    await expect(page.getByText("Weekly incentive")).toBeVisible();
    await expect(page.getByText(/R100 bonus/i).first()).toBeVisible();
  });

  test("captures referral from ?ref= on home", async ({ page }) => {
    await page.goto("/?ref=VR1234ABC");
    await dismissCountryModalIfPresent(page);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("vr_referred_by_v1")))
      .toBe("VR1234ABC");
  });
});
