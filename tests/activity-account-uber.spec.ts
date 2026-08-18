import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

/**
 * Functional smoke: Activity + Account behave like Uber app shell
 * (tabs, trip list actions, profile, no WhatsApp FAB over Account).
 */
test.describe("Activity & Account — Uber-style functionality", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("no WhatsApp FAB on Home / Activity / Account", async ({ page }) => {
    for (const path of ["/", "/activity", "/account"]) {
      await page.goto(path);
      await dismissCountryModalIfPresent(page);
      await expect(
        page.locator('a[aria-label="WhatsApp support"]'),
      ).toHaveCount(0);
    }
  });

  test("Activity: phone gate → Past/Upcoming → empty or trips", async ({
    page,
  }) => {
    await page.goto("/activity");
    await dismissCountryModalIfPresent(page);

    await expect(
      page.getByRole("heading", { name: /^Activity$/i }),
    ).toBeVisible({ timeout: 15_000 });

    const phoneGate = page.getByPlaceholder(/Phone number/i);
    if (await phoneGate.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await phoneGate.fill("0821234567");
      await page.getByPlaceholder(/Name/i).fill("Uber Check");
      await page.getByRole("button", { name: /View activity/i }).click();
    }

    await expect(page.getByRole("heading", { name: /^Upcoming$/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: /^Past$/i })).toBeVisible();
    await expect(
      page.getByText(/You have no upcoming trips|No past trips yet|R\s?\d+/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Account: profile, tiles, menu, sign out", async ({ page }) => {
    await page.goto("/account");
    await dismissCountryModalIfPresent(page);
    await page.evaluate(() => {
      localStorage.setItem(
        "village_ride_guest_profile",
        JSON.stringify({
          name: "Func Rider",
          phone: "0829998877",
          country_code: "ZA",
        }),
      );
    });
    await page.reload();
    await dismissCountryModalIfPresent(page);

    const account = page.getByTestId("account-view");
    await expect(account.getByRole("heading", { name: /Func Rider/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(account.getByRole("link", { name: /^Help$/i })).toBeVisible();
    await expect(account.getByRole("link", { name: /^Wallet$/i })).toBeVisible();
    await expect(account.getByRole("link", { name: /^Safety$/i })).toBeVisible();
    await expect(account.getByRole("link", { name: /^Inbox$/i })).toBeVisible();
    await expect(account.getByRole("link", { name: /Saved places/i })).toBeVisible();
    await expect(
      account.getByRole("link", { name: /Payment methods/i }),
    ).toBeVisible();
    await expect(account.getByText(/Invite friends/i)).toBeVisible();
    await expect(account.getByRole("button", { name: /Sign out/i })).toBeVisible();

    await account.getByRole("button", { name: /Sign out/i }).click();
    await expect(account.getByRole("button", { name: /^Save$/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test("bottom nav: Home · Activity · Account", async ({ page }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);
    const nav = page.getByRole("navigation", { name: /Main/i });
    await expect(nav.getByRole("link", { name: /^Home$/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Activity$/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Account$/i })).toBeVisible();
    await nav.getByRole("link", { name: /^Account$/i }).click();
    await expect(page).toHaveURL(/\/account/);
    await expect(
      page.locator('a[aria-label="WhatsApp support"]'),
    ).toHaveCount(0);
  });
});
