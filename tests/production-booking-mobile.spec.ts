import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Production booking pages (mobile)", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  for (const path of ["/ride", "/delivery", "/courier", "/group", "/"]) {
    test(`${path} loads without error screen`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      await page.goto(path);
      await dismissCountryModalIfPresent(page);

      await expect(page.getByText("Something went wrong")).toHaveCount(0, {
        timeout: 25_000,
      });
      await expect(page.getByText(/Try again, or contact support/i)).toHaveCount(
        0,
        { timeout: 5_000 },
      );

      if (errors.length) {
        console.log(`JS errors on ${path}:`, errors);
      }
      expect(
        errors.filter(
          (e) =>
            !/favicon|Failed to load resource|404|Mapbox|WebGL/i.test(e),
        ),
      ).toEqual([]);
    });
  }
});
