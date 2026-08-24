import { expect, test } from "@playwright/test";
import { prepareBrowserContext } from "./helpers/auth-helper";

const PAGES = ["/ride", "/delivery", "/courier", "/farm"] as const;

test.describe("Card (PayPal) and cash on booking sheets", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  for (const path of PAGES) {
    test(`${path} offers Cash and Card`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("payment-selector")).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId("pay-cash")).toBeVisible();
      await expect(page.getByTestId("pay-card")).toBeVisible();
      await expect(page.getByTestId("pay-cash")).toHaveAttribute(
        "data-selected",
        "true",
      );
      await page.getByTestId("pay-card").click();
      await expect(page.getByTestId("pay-card")).toHaveAttribute(
        "data-selected",
        "true",
      );
    });
  }
});
