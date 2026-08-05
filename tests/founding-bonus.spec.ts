import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Founding Driver Bonus Pool", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("marketing card loads with cities, URL, light footer, download CTA", async ({
    page,
  }) => {
    await page.goto("/marketing/founding-driver");
    await dismissCountryModalIfPresent(page);

    await expect(
      page.getByRole("heading", { name: /Founding Driver card/i }),
    ).toBeVisible({ timeout: 15_000 });

    const card = page.getByTestId("founding-driver-card");
    await expect(card).toBeVisible();
    await expect(card.getByText(/Founding Driver/i).first()).toBeVisible();
    await expect(card.getByText(/Johannesburg/i)).toBeVisible();
    await expect(card.getByText(/Cape Town/i)).toBeVisible();
    await expect(card.getByText(/Durban/i)).toBeVisible();
    await expect(card.getByText(/Pretoria/i)).toBeVisible();
    await expect(card.getByText(/village-ride\.vercel\.app/i)).toBeVisible();
    await expect(
      card.getByText(/Village Ride from Sandton Streets/i),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Download & Share/i }),
    ).toBeVisible();
  });

  test("admin bonus payouts page loads cities", async ({ page }) => {
    await page.goto("/admin/bonus-payouts");
    await dismissCountryModalIfPresent(page);

    await expect(
      page.getByRole("heading", { name: /Founding Driver bonus payouts/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Johannesburg", { exact: true })).toBeVisible();
    await expect(page.getByText("Cape Town", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Calculate & Distribute 2% Bonus/i }).first(),
    ).toBeVisible();
  });

  test("driver earnings shows founding bonus pool card when era open", async ({
    page,
  }) => {
    await page.goto("/driver");
    await dismissCountryModalIfPresent(page);

    const select = page.locator("select").first();
    if (await select.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await select.selectOption("d1");
      await page.getByRole("button", { name: /Enter driver app/i }).click();
      const skip = page.getByRole("button", { name: /^Skip$/i });
      if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await skip.click();
      }
    }

    await page.goto("/driver/earnings");
    await expect(
      page.getByTestId("founding-bonus-pool-card"),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/Founding Driver Bonus Pool/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Request Payout/i }),
    ).toBeVisible();
  });
});
