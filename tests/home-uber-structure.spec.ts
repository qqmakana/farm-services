import { test, expect } from "@playwright/test";
import {
  dismissCountryModalIfPresent,
  prepareBrowserContext,
} from "./helpers/auth-helper";

test.describe("Home Uber structure", () => {
  test.beforeEach(async ({ context }) => {
    await prepareBrowserContext(context);
  });

  test("white home: Where to, Later, For you; Later opens schedule", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    await expect(page.getByTestId("uber-home")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("drive-signup-card")).toBeVisible();
    await expect(page.getByTestId("home-drive-signup-cta")).toHaveText(
      /Sign up to drive/i,
    );
    await expect(page.getByTestId("home-mode-tabs")).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Ride$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /For you/i })).toBeVisible();
    await expect(page.getByTestId("home-where-to")).toBeVisible();
    await expect(page.getByTestId("home-later")).toBeVisible();
    await expect(page.getByTestId("home-recents")).toBeAttached();
    await expect(page.getByText(/Bassonia|Engen Meyersdal/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Plan your ride/i })).toHaveCount(0);
    await expect(page.getByTestId("service-circle-for-you")).toHaveAttribute(
      "data-primary",
      "true",
    );
    await expect(page.getByTestId("service-circle-send-items")).toBeAttached();
    await expect(page.getByTestId("service-circle-farm")).toBeVisible();
    await expect(page.getByTestId("service-circle-reserve")).toBeVisible();
    await expect(page.getByTestId("service-circle-groups")).toBeVisible();
    await expect(page.getByTestId("service-circle-delivery")).toBeVisible();
    await expect(page.getByTestId("smart-suggestions")).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId("home-later").click();
    await expect(page.getByTestId("home-later-datetime")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("home-later-datetime")).toHaveCount(0);
  });

  test("smart suggestions: Add home and nearby, tap sets destination", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    await expect(page.getByTestId("uber-home")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("smart-suggestions")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("home-recents")).toBeAttached();
    await expect(page.getByTestId("add-home")).toBeVisible();
    await expect(page.getByTestId("home-nearby")).toBeVisible({
      timeout: 20_000,
    });

    await page.getByTestId("home-nearby").getByRole("button").first().click();
    await expect(page).toHaveURL(/\/ride\?/, { timeout: 15_000 });
    await expect(page).toHaveURL(/to=/);
  });

  test("smart suggestions: no GPS does not invent a nearby town", async ({
    page,
    context,
  }) => {
    await context.clearPermissions();
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    await expect(page.getByTestId("smart-suggestions")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("add-home")).toBeVisible();
    await expect(page.getByTestId("home-nearby")).toHaveCount(0);
    await expect(page.getByText(/Alice|Fort Hare/i)).toHaveCount(0);
  });

  test("smart suggestions: Johannesburg GPS still fills nearby", async ({
    page,
    context,
  }) => {
    await context.setGeolocation({ latitude: -26.2041, longitude: 28.0473 });
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    await expect(page.getByTestId("smart-suggestions")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("add-home")).toBeVisible();
    await expect(page.getByTestId("home-nearby")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("home Sign up to drive opens join", async ({ page }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);

    const cta = page.getByTestId("home-drive-signup-cta");
    await expect(cta).toBeVisible({ timeout: 15_000 });
    await cta.click();
    await expect(page).toHaveURL(/\/driver\/join/, { timeout: 45_000 });
    await expect(
      page.getByRole("heading", { name: /Drive with/i }),
    ).toBeVisible({ timeout: 15_000 });
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

  test("For you is default; service icons open booking pages", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByTestId("uber-home")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("smart-suggestions")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("service-circle-for-you")).toHaveAttribute(
      "data-primary",
      "true",
    );

    await page.getByTestId("service-circle-trip").click();
    await expect(page).toHaveURL(/\/ride/, { timeout: 15_000 });

    await page.goto("/");
    await dismissCountryModalIfPresent(page);
    await page.getByTestId("service-circle-reserve").click();
    await expect(page).toHaveURL(/\/ride\?when=later/, { timeout: 15_000 });
    await expect(page.getByTestId("reservation-fee-line")).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/");
    await dismissCountryModalIfPresent(page);
    await page.getByTestId("home-where-to").click();
    await expect(page).toHaveURL(/\/ride/, { timeout: 15_000 });
  });

  test("Services page Reserve, Groups, Farm also navigate", async ({
    page,
  }) => {
    await page.goto("/services");
    await dismissCountryModalIfPresent(page);

    await page.getByTestId("service-circle-reserve").click();
    await expect(page).toHaveURL(/\/ride\?when=later/, { timeout: 15_000 });

    await page.goto("/services");
    await page.getByTestId("service-circle-groups").click();
    await expect(page).toHaveURL(/\/group/, { timeout: 15_000 });
    await expect(page.getByText(/60% of a private Trip/i)).toBeVisible();

    await page.goto("/services");
    await page.getByTestId("service-circle-farm").click();
    await expect(page).toHaveURL(/\/farm/, { timeout: 15_000 });
  });

  test("service sheets load; Reserve shows reservation fee", async ({
    page,
  }) => {
    await page.goto("/ride?when=later");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByTestId("reservation-fee-line")).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/courier");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByRole("heading", { name: /^Courier$/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/delivery");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByRole("heading", { name: /^Delivery$/i })).toBeVisible(
      { timeout: 15_000 },
    );
    await expect(page.getByTestId("delivery-insurance-on")).toBeVisible();

    await page.goto("/farm");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByRole("heading", { name: /^Farm$/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/shops");
    await dismissCountryModalIfPresent(page);
    await expect(page.getByText(/Shop & Deliver/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("shop-know")).toBeVisible();
    await expect(page.getByTestId("shop-find")).toBeVisible();
  });
});
