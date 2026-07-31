import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
  isProductionBase,
} from "./helpers/auth-helper";
import { testLocations } from "./helpers/test-data";

test.describe("Describe Your Place", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("ride shows describe examples and landmark helper", async ({ page }) => {
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/Describe your place|Describe your pickup/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", {
        name: /green gate|mango tree|Blue house|clinic/i,
      }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/when the map|network is weak/i).first(),
    ).toBeVisible();
  });

  test("tapping an example fills pickup description", async ({ page }) => {
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);
    const example = page
      .getByRole("button", { name: /green gate|mango tree/i })
      .first();
    await example.click();
    await expect
      .poll(async () => {
        const values = await page.locator("input").evaluateAll((els) =>
          els.map((el) => (el as HTMLInputElement).value),
        );
        return values.some((v) => /green gate|mango tree/i.test(v));
      }, { timeout: 8_000 })
      .toBe(true);
  });

  test("delivery shows describe pickup place", async ({ page }) => {
    await page.goto("/delivery");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/Describe pickup place|Describe your place/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("saved places page mentions Farm + offline", async ({ page }) => {
    await page.goto("/account/places");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Saved Places|offline|Farm/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/Describe Your Place|Share:/i).first(),
    ).toBeVisible();
  });

  test("optional pickup photo control is present on ride", async ({ page }) => {
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByText(/Photo of pickup spot/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/skip this if signal is weak/i).first()).toBeVisible();
  });

  test("offline banner path does not crash booking UI", async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(isProductionBase(baseURL), "Offline emulation local-only");
    await prepareBrowserContext(context);
    await page.goto("/ride");
    await dismissCountryModalIfPresent(page);
    await expect(
      page.getByPlaceholder(/mango tree|landmark|Pickup|green gate/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await context.setOffline(true);
    await expect(page.locator("body")).toBeVisible();
    await context.setOffline(false);

    await page
      .getByPlaceholder(/mango tree|landmark|Pickup|green gate/i)
      .first()
      .fill(testLocations.pickup);
  });
});
