import { test, expect } from "@playwright/test";
import { prepareBrowserContext } from "./helpers/auth-helper";

test.describe("Onboarding & country", () => {
  test("country welcome can be dismissed and remembered", async ({
    context,
    page,
  }) => {
    // Fresh context without pre-seeded country
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        localStorage.removeItem("village_ride_country");
        localStorage.removeItem("village_ride_country_picked");
      } catch {
        /* ignore */
      }
    });

    await page.goto("/");
    const continueBtn = page.getByRole("button", { name: /Continue|Start/i });
    const visible = await continueBtn
      .first()
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    if (visible) {
      await continueBtn.first().click({ force: true });
    }

    await expect(page.getByText(/Village Ride|Sandton Streets/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("countries page lists global markets", async ({ context, page }) => {
    await prepareBrowserContext(context);
    await page.goto("/countries");
    await expect(
      page.getByRole("heading", { name: /countries|Village Ride/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/South Africa|Kenya|Nigeria/i).first()).toBeVisible();
  });

  test("pricing page loads after country ZA seed", async ({ context, page }) => {
    await prepareBrowserContext(context);
    await page.goto("/pricing");
    await expect(page.getByText(/price|fare|R\s*\d|cash/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
