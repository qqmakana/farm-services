import { test, expect } from "@playwright/test";
import { prepareBrowserContext } from "./helpers/auth-helper";

test.describe("Feature tour", () => {
  test("shows unique feature slides and can finish", async ({
    context,
    page,
  }) => {
    await prepareBrowserContext(context);
    await context.addInitScript(() => {
      try {
        localStorage.removeItem("vr_feature_tour_seen_v3");
        localStorage.removeItem("vr_feature_tour_seen_v2");
        localStorage.removeItem("vr_feature_tour_seen_v1");
        localStorage.removeItem("vr_onboarding_seen_v1");
        localStorage.removeItem("vr_feature_tour_seen_v5");
        localStorage.removeItem("vr_feature_tour_seen_v4");
        sessionStorage.removeItem("vr_feature_tour_skip_session");
        sessionStorage.removeItem("vr_onboarding_skip_session");
      } catch {
        /* ignore */
      }
    });

    await page.goto("/onboarding?replay=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /^Skip$/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/Trip, Fetch, Send|Shops/i).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Next$/i }).click();
    await expect(page.getByText(/Buy from local shops/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/pay for the goods/i).first()).toBeVisible();

    await page.getByRole("button", { name: /^Next$/i }).click();
    await expect(page.getByText(/Describe your place/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/when the map/i).first()).toBeVisible();

    await page.getByRole("button", { name: /^Next$/i }).click();
    await expect(page.getByText(/end of September/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("onboarding-install-cta")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Get started/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Get started/i }).click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
  });

  test("account offers See features again", async ({ context, page }) => {
    await prepareBrowserContext(context);
    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText(/See features again/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});