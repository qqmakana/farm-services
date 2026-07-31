import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  ensureDriverOnline,
  isProductionBase,
  prepareBrowserContext,
  selectMockDriver,
} from "./helpers/auth-helper";

test.describe("Out of Fuel (driver emergency)", () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    test.skip(
      isProductionBase(baseURL),
      "Fuel help uses mock driver gate — run locally",
    );
    await prepareBrowserContext(context);
    await dismissCountryModalIfPresent(page);
  });

  test("driver home shows Out of fuel control", async ({ page }) => {
    await selectMockDriver(page);
    await ensureDriverOnline(page);
    await expect(
      page.getByRole("button", { name: /Out of fuel/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("driver can open fuel form and request 10L", async ({ page }) => {
    await selectMockDriver(page);
    await ensureDriverOnline(page);

    await page.getByRole("button", { name: /Out of fuel/i }).click();
    await expect(page.getByText(/Request fuel help|How much/i).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /^10L$/ }).click();
    await page
      .getByPlaceholder(/clinic gate|where you are/i)
      .fill("Near clinic gate, N2 after Engcobo");

    await page.getByRole("button", { name: /Request fuel now/i }).click();

    await expect(
      page.getByText(/Your fuel request|pending|assigned/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    // Keep store clean for the next test
    const cancel = page.getByRole("button", { name: /^Cancel$/i });
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
    }
  });

  test("second mock driver can see nearby fuel help", async ({ browser }) => {
    const requesterCtx = await browser.newContext();
    const helperCtx = await browser.newContext();
    await prepareBrowserContext(requesterCtx);
    await prepareBrowserContext(helperCtx);

    const requester = await requesterCtx.newPage();
    const helper = await helperCtx.newPage();

    await selectMockDriver(requester, "d1");
    await ensureDriverOnline(requester);

    // Clear leftover open request (card shows Cancel without expanding form)
    const cancelExisting = requester.getByRole("button", { name: /^Cancel$/i });
    if (await cancelExisting.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cancelExisting.click();
      await expect(requester.getByText(/Your fuel request/i)).toHaveCount(0, {
        timeout: 15_000,
      });
    }

    await requester.getByRole("button", { name: /Out of fuel/i }).click();
    const amount5 = requester.getByRole("button", { name: /^5L$/ });
    if (!(await amount5.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // Toggle may have closed an already-open panel — click again
      await requester.getByRole("button", { name: /Out of fuel/i }).click();
    }
    await expect(amount5).toBeVisible({ timeout: 10_000 });
    await amount5.click();
    await requester
      .getByPlaceholder(/clinic gate|where you are/i)
      .fill("Stuck near mango tree, Qunu");
    await requester.getByRole("button", { name: /Request fuel now/i }).click();
    await expect(
      requester.getByText(/Your fuel request/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await selectMockDriver(helper, "d2");
    await ensureDriverOnline(helper);
    await expect(
      helper.getByText(/Drivers need fuel nearby|Need 5L/i).first(),
    ).toBeVisible({ timeout: 25_000 });
    await helper.getByRole("button", { name: /I can bring fuel/i }).first().click();

    await expect(
      requester.getByText(/assigned|helper is on the way/i).first(),
    ).toBeVisible({ timeout: 25_000 });

    await requesterCtx.close();
    await helperCtx.close();
  });
});
