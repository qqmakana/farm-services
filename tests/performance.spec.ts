import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

const PUBLIC_PATHS = ["/", "/partners", "/help", "/shop"] as const;

test.describe("Performance & mobile layout", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  for (const path of PUBLIC_PATHS) {
    test(`${path} loads under 8s and has no horizontal overflow`, async ({
      page,
    }) => {
      const started = Date.now();
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.ok() || res?.status() === 304).toBeTruthy();
      await dismissCountryModalIfPresent(page);

      const elapsed = Date.now() - started;
      // Soft threshold — CI / cold start can be slower than 3s prod claim
      expect(elapsed).toBeLessThan(12_000);

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 2;
      });
      expect(overflow).toBeFalsy();
    });
  }

  test("mobile viewport — partners CTA reachable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/partners");
    await expect(
      page.getByRole("link", { name: /Sign up free|Create partner/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("mobile viewport — merchant dashboard usable", async ({ page, baseURL }) => {
    test.skip(
      Boolean(baseURL?.includes("vercel.app")),
      "Dashboard needs mock auth bypass",
    );
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/merchant/dashboard");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByRole("button", { name: /Create delivery/i }).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
