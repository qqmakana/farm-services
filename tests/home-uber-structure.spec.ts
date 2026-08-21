import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Home Uber structure", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  test("map home: Plan your ride, Where to, For you; Later opens Reserve", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    await expect(page.getByTestId("uber-home")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Plan your ride/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /For you/i })).toBeVisible();
    await expect(page.getByTestId("home-where-to")).toBeVisible();
    await expect(page.getByTestId("home-later")).toBeVisible();
    await expect(page.getByTestId("home-recents")).toBeAttached();
    await expect(page.getByText(/Bassonia|Engen Meyersdal/i)).toHaveCount(0);
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

  test("Earn by driving is on Account and opens join", async ({ page }) => {
    await page.goto("/account");
    await dismissCountryModalIfPresent(page);

    const cta = page.getByTestId("drive-signup-cta");
    await expect(cta).toBeVisible({ timeout: 15_000 });
    await expect(cta).toHaveText(/Earn by driving/i);

    await cta.click();
    await expect(page).toHaveURL(/\/driver\/join/, { timeout: 45_000 });
    await expect(
      page.getByRole("heading", { name: /Drive with/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
