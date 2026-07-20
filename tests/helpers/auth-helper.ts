import { expect, type BrowserContext, type Page } from "@playwright/test";

export const MTHATHA = { latitude: -31.5833, longitude: 28.7833 };

/** Skip first-run country picker and grant Notification.permission. */
export async function prepareBrowserContext(context: BrowserContext) {
  await context.grantPermissions(["geolocation", "notifications"]);
  await context.setGeolocation(MTHATHA);
  await context.addInitScript(`
    try {
      localStorage.setItem("village_ride_country", "ZA");
      localStorage.setItem("village_ride_country_picked", "1");
    } catch (e) {}
    try {
      Object.defineProperty(window.Notification, "permission", {
        configurable: true,
        get: function () { return "granted"; },
      });
      window.Notification.requestPermission = async function () { return "granted"; };
    } catch (e) {}
  `);
}

export async function dismissCountryModalIfPresent(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("village_ride_country", "ZA");
      localStorage.setItem("village_ride_country_picked", "1");
    } catch {
      /* ignore */
    }
  });
  const continueBtn = page.getByRole("button", { name: "Continue" });
  if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await continueBtn.click({ force: true });
    await expect(continueBtn).toBeHidden({ timeout: 5000 }).catch(() => undefined);
  }
}

export async function selectMockDriver(
  page: Page,
  driverId = "d1",
) {
  await page.goto("/driver");
  await dismissCountryModalIfPresent(page);
  const select = page.locator("select").first();
  await expect(select).toBeVisible({ timeout: 20_000 });
  await select.selectOption(driverId);
  await page.getByRole("button", { name: /Enter driver app/i }).click();
  await page.waitForURL("**/driver/home", { timeout: 20_000 });
}

export async function ensureDriverOnline(page: Page) {
  const goOnline = page.getByRole("button", { name: "Go Online" });
  if (await goOnline.isVisible().catch(() => false)) {
    await goOnline.click();
  }
  await expect(page.getByRole("button", { name: "Go Offline" })).toBeVisible({
    timeout: 15_000,
  });
}

export function isProductionBase(baseURL?: string) {
  return Boolean(baseURL?.includes("village-ride.vercel.app"));
}
