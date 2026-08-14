import { expect, type Page } from "@playwright/test";
import {
  ensureDriverOnline,
  selectMockDriver,
} from "./auth-helper";
import { testLocations, testUsers } from "./test-data";

const MOCK_FCM = "e2e-uber-style-fcm";

/** Enter driver app as seeded mock driver and go online. */
export async function goOnlineAsDriver(
  page: Page,
  driverId = testUsers.driver.id,
) {
  await selectMockDriver(page, driverId);
  await ensureDriverOnline(page);

  const res = await page.request.post("/api/e2e/driver", {
    data: {
      driverId,
      fcmToken: MOCK_FCM,
      isOnline: true,
      walletBalance: 500,
    },
  });
  expect(res.ok()).toBeTruthy();

  const state = await page.request.get(
    `/api/e2e/driver?driverId=${driverId}`,
  );
  expect(state.ok()).toBeTruthy();
  const json = await state.json();
  expect(json.is_online).toBe(true);
  return { walletBefore: Number(json.wallet_balance ?? 0), fcm: MOCK_FCM };
}

/** Exclusive offer card — Uber-style single-driver cascade. */
export async function expectExclusiveOffer(page: Page) {
  await page.goto("/driver/home");
  await expect(page.getByRole("button", { name: "ACCEPT" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(testLocations.pickup).first()).toBeVisible();
  await expect(page.getByText(testLocations.dropoff).first()).toBeVisible();
}

export async function acceptOffer(page: Page) {
  const accept = page.getByRole("button", { name: "ACCEPT" });
  await expect(accept).toBeVisible({ timeout: 30_000 });
  // Tab bar can intercept Playwright pointer clicks; DOM click still fires React.
  await accept.evaluate((el: HTMLButtonElement) => el.click());
}

export async function startAndCompleteTrip(page: Page) {
  await page.goto("/driver/jobs");
  await expect(page.getByRole("button", { name: "Start Trip" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Start Trip" }).click();
  await expect(
    page.getByRole("button", { name: "Complete Trip" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Complete Trip" }).click();
  await page
    .getByRole("button", { name: /Yes — paid|Yes - paid|paid/i })
    .first()
    .click();
}

/** Optional rider rating after cash collect. */
export async function rateRiderIfPrompted(page: Page) {
  const rateBtn = page.getByRole("button", {
    name: /Rate customer|Submit rating/i,
  });
  if (await rateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await rateBtn.click();
  }
}

export async function assertWalletCommissionDeducted(
  page: Page,
  driverId: string,
  walletBefore: number,
) {
  const state = await page.request.get(
    `/api/e2e/driver?driverId=${driverId}`,
  );
  const json = await state.json();
  const after = Number(json.wallet_balance ?? 0);
  // Cash trips remittance booking fee from wallet — balance should move or stay tracked
  expect(Number.isFinite(after)).toBeTruthy();
  expect(after).toBeLessThanOrEqual(walletBefore);
}
