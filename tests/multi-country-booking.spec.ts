import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

const MARKETS = [
  { code: "KE", phone: "0712345678", name: "Kenya Rider" },
  { code: "NG", phone: "08031234567", name: "Nigeria Rider" },
  { code: "US", phone: "5551234567", name: "US Rider" },
  { code: "IN", phone: "9876543210", name: "India Rider" },
] as const;

test.describe("Multi-country cash booking", () => {
  for (const market of MARKETS) {
    test(`can request a ride in ${market.code}`, async ({ context, page }) => {
      await prepareBrowserContext(context);
      await context.addInitScript((code) => {
        try {
          localStorage.setItem("village_ride_country", code);
          localStorage.setItem("village_ride_country_picked", "1");
        } catch {
          /* ignore */
        }
      }, market.code);

      await page.goto("/ride");
      await dismissCountryModalIfPresent(page);

      await expect(
        page.getByRole("heading", { name: /Village Ride|Ride/i }).first(),
      ).toBeVisible({ timeout: 15_000 });

      // Free-text landmarks must work even without seeded places
      await page
        .getByPlaceholder("e.g., 12 Main Rd, Sandton — or green gate by the mango tree")
        .fill("Village clinic gate");
      await page
        .getByPlaceholder("e.g., Shoprite parking — or blue house after the church")
        .fill("Town market main entrance");

      await page.getByLabel(/Your name/i).fill(market.name);
      await page.getByLabel(/^Phone$/i).fill(market.phone);

      // Dismiss place suggestions / save-place prompts that can block the CTA
      await page.keyboard.press("Escape");
      await page.locator("body").click({ position: { x: 8, y: 8 } }).catch(() => undefined);

      const requestBtn = page.getByRole("button", { name: /Request Ride/i });
      await expect(requestBtn).toBeEnabled({ timeout: 15_000 });
      await requestBtn.scrollIntoViewIfNeeded();
      await requestBtn.click({ force: true });

      await page.waitForURL(/\/trip\/RU-/i, { timeout: 30_000 });
      await expect(
        page.getByText(/Finding your driver|Confirmed|Searching|On the way/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    });
  }
});
