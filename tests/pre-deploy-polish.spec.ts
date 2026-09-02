import { test, expect, type Page } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

async function cssText(page: Page) {
  return page.evaluate(() => {
    const texts: string[] = [];
    const walk = (sheet: CSSStyleSheet) => {
      try {
        for (const rule of sheet.cssRules) {
          texts.push(rule.cssText);
        }
      } catch {
        /* cross-origin */
      }
    };
    for (const sheet of document.styleSheets) walk(sheet);
    return texts.join("\n");
  });
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.evaluate(() => {
    try {
      localStorage.setItem("vr_feature_tour_seen_v6", "1");
      localStorage.setItem("vr_onboarding_seen_v1", "1");
      localStorage.setItem("village_ride_country", "ZA");
      localStorage.setItem("village_ride_country_picked", "1");
    } catch {
      /* ignore */
    }
  });
  await dismissCountryModalIfPresent(page);
  const loading = page.getByLabel("Loading");
  if (await loading.isVisible().catch(() => false)) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await dismissCountryModalIfPresent(page);
  }
}

test.describe("Pre-deploy polish checklist", () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("1a) shops search empty state", async ({ page }) => {
    await open(page, "/shops");
    await expect(page.getByTestId("shop-results")).toHaveAttribute(
      "data-hydrated",
      "1",
      { timeout: 45_000 },
    );
    const find = page.getByTestId("shop-find");
    await find.evaluate((el) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, "xyz123");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.form?.requestSubmit();
    });
    await expect(page.getByTestId("shop-results")).toHaveAttribute(
      "data-q",
      "xyz123",
      { timeout: 10_000 },
    );
    await expect(page.getByTestId("shop-results")).toHaveAttribute(
      "data-count",
      "0",
    );
    const nearby = page.getByText("No shops nearby yet");
    const miss = page.getByText(/No results for ['‘]xyz123['’]/);
    await expect(nearby.or(miss)).toBeVisible();
  });

  test("1b) activity empty state", async ({ page }) => {
    await open(page, "/activity");
    await expect(page.getByText("No trips yet")).toBeVisible({ timeout: 45_000 });
    await expect(
      page.getByText("Your trip history will appear here"),
    ).toBeVisible();
  });

  test("1c) empty cart after removing items", async ({ page }) => {
    await open(page, "/shops");
    await expect(page.getByTestId("shop-results")).toHaveAttribute(
      "data-hydrated",
      "1",
      { timeout: 45_000 },
    );
    const shopCard = page.locator("#find-shop a").first();
    test.skip(
      !(await shopCard.isVisible({ timeout: 8_000 }).catch(() => false)),
      "No shops in DB",
    );
    await shopCard.click();
    const add = page.getByRole("button", { name: /^Add / }).first();
    await add.click({ timeout: 45_000 });
    await page.getByRole("button", { name: /View cart/i }).click();
    await page.getByRole("button", { name: "Decrease" }).first().click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await expect(page.getByText("Add items from a local shop")).toBeVisible();
  });

  test("2) tap physics CSS scales", async ({ page }) => {
    await open(page, "/activity");
    await expect(page.getByTestId("customer-tab-bar")).toBeVisible({
      timeout: 20_000,
    });
    const css = await cssText(page);
    expect(css).toContain("scale(0.97)");
    expect(css).toContain("scale(0.98)");
    expect(css).toContain("scale(0.85)");
    expect(css).toMatch(/scale\(0\.9\)/);
  });

  test("2b) tabs fill when active; shop chips fill vs border", async ({
    page,
  }) => {
    await open(page, "/activity");
    const home = page.getByTestId("customer-tab-home");
    await expect(home).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByTestId("customer-tab-activity").locator("span").first(),
    ).toHaveClass(/bg-\[#EEEEEE\]/);

    await open(page, "/shops");
    await expect(page.getByTestId("shop-results")).toHaveAttribute(
      "data-hydrated",
      "1",
      { timeout: 45_000 },
    );
    const all = page.getByRole("tab", { name: "All", exact: true });
    await expect(all).toBeVisible();
    await expect(all).toHaveAttribute("aria-selected", "true");
    const groceries = page.getByRole("tab", { name: "Groceries", exact: true });
    await expect(groceries).toHaveAttribute("aria-selected", "false");
    await groceries.click();
    await expect(groceries).toHaveAttribute("aria-selected", "true");
  });

  test("3) Send package icons + Bakkie on fridge/furniture", async ({
    page,
  }) => {
    await open(page, "/courier");
    await expect(page.getByTestId("bottom-sheet")).toBeVisible({
      timeout: 25_000,
    });
    await page.getByPlaceholder(/Pickup landmark/i).click();
    await expect(page.getByTestId("package-documents")).toBeVisible();
    await expect(page.getByTestId("package-documents")).toContainText("Car");
    await expect(page.getByTestId("package-medium_package")).toContainText(
      "Groceries",
    );
    await expect(page.getByTestId("package-medium_package")).toContainText("Car");
    await page.getByTestId("package-appliance").click();
    await expect(page.getByTestId("package-appliance")).toContainText("Bakkie");
    await page.getByTestId("package-furniture").click();
    await expect(page.getByTestId("package-furniture")).toContainText("Bakkie");
  });

  test("4) loading: skeleton + map pulse", async ({ page }) => {
    await open(page, "/activity");
    const css = await cssText(page);
    expect(css).toContain("vr-shimmer");
    expect(css).toContain(".vr-skeleton");
    expect(css).toContain(".vr-map-pulse");
    expect(css).toContain(".vr-spin");

    await open(page, "/courier");
    await expect(page.locator(".vr-map-pulse").first()).toBeVisible({
      timeout: 25_000,
    });
  });

  test("5) offline banner", async ({ page }) => {
    await open(page, "/activity");
    await expect(page.getByTestId("customer-tab-bar")).toBeVisible({
      timeout: 20_000,
    });
    await page.evaluate(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        get: () => false,
      });
      window.dispatchEvent(new Event("offline"));
    });
    await page.getByTestId("offline-banner").waitFor({ state: "visible", timeout: 8_000 }).catch(async () => {
      await page.evaluate(() => {
        window.dispatchEvent(new Event("offline"));
      });
    });
    await expect(page.getByTestId("offline-banner")).toBeVisible();
    await expect(
      page.getByText(/No connection\. Check your signal/),
    ).toBeVisible();
  });

  test("6) transitions: where-to sheet, shop slide, stagger, sheet drag", async ({
    page,
  }) => {
    await open(page, "/");
    await expect(page.getByTestId("home-where-to")).toBeVisible({
      timeout: 45_000,
    });
    await page.getByTestId("home-where-to").click();
    const where = page.getByTestId("home-where-search");
    await expect(where).toBeVisible();
    await expect(where).toHaveClass(/uber-sheet-panel/);

    await open(page, "/shops");
    await expect(page.getByTestId("shop-find")).toBeVisible({ timeout: 45_000 });
    const list = page.locator("#find-shop");
    if (await list.isVisible().catch(() => false)) {
      await expect(list).toHaveClass(/vr-stagger/);
      await list.locator("a").first().click();
      await expect(page.locator(".vr-screen-enter").first()).toBeVisible({
        timeout: 20_000,
      });
    }

    await open(page, "/courier");
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).toBeVisible({ timeout: 25_000 });
    const handle = page.getByTestId("drag-handle");
    const box = await handle.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 90, { steps: 8 });
    const snap = await sheet.getAttribute("data-sheet-snap");
    const height = await sheet.evaluate((el) => el.style.height);
    await page.mouse.up();
    expect(snap || height).toBeTruthy();
  });

  test("8) polish tokens: heading is near-black", async ({ page }) => {
    await open(page, "/activity");
    const h1 = page.getByRole("heading", { name: "Activity" });
    await expect(h1).toBeVisible({ timeout: 20_000 });
    await expect(h1).toHaveCSS("color", "rgb(17, 17, 17)");
  });
});
