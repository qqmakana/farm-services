import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Home Uber structure", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  test("Where to? + recents + For you circles; Later opens Reserve modal", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    await expect(page.getByTestId("uber-home")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /For you/i })).toBeVisible();
    await expect(page.getByTestId("home-where-to")).toBeVisible();
    await expect(page.getByTestId("home-later")).toBeVisible();
    await expect(page.getByTestId("home-recents")).toBeVisible();
    await expect(page.getByTestId("service-circle-trip")).toHaveAttribute(
      "data-primary",
      "true",
    );
    await expect(page.getByTestId("service-circle-send-items")).toBeVisible();
    await expect(page.getByTestId("service-circle-farm")).toBeVisible();

    await page.getByTestId("home-later").click();
    await expect(page.getByTestId("home-later-datetime")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("home-later-datetime")).toHaveCount(0);
  });

  test("promo banner can be dismissed", async ({ page }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    const promo = page.getByTestId("drive-signup-card");
    await expect(promo).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("dismiss-home-promo").click();
    await expect(promo).toHaveCount(0);
  });
});
