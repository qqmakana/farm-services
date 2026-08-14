import { expect, type Page } from "@playwright/test";
import {
  rideBookingUrl,
  testLocations,
  testUsers,
} from "./test-data";
import { dismissCountryModalIfPresent } from "./auth-helper";

/** Open ride sheet with map + Where to? (Uber-style choose-a-ride). */
export async function openRideSheet(page: Page) {
  await page.goto(rideBookingUrl());
  await dismissCountryModalIfPresent(page);
  await expect(page.locator("[data-testid=\"ride-map\"]")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("dropoff-input")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByPlaceholder(/Where to\?/i)).toBeVisible();
}

/** Fill rider contact (guest booking — shown when name/phone empty). */
export async function fillRiderContact(
  page: Page,
  rider = testUsers.rider,
) {
  const nameField = page.getByPlaceholder("Your name");
  if (!(await nameField.isVisible().catch(() => false))) {
    const more = page.getByRole("button", { name: /More options/i });
    if (await more.isVisible().catch(() => false)) {
      await more.click();
    }
  }
  await expect(nameField).toBeVisible({ timeout: 10_000 });
  await nameField.fill(rider.name);
  await page.getByPlaceholder("063 621 3590").fill(rider.phone);
}

/** Assert cash is available, selected by default, and no surge copy. */
export async function assertCashAndNoSurge(page: Page) {
  await expect(page.getByTestId("payment-selector")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("pay-cash")).toHaveAttribute(
    "data-selected",
    "true",
  );
  await expect(page.getByTestId("cash-payment-message")).toBeVisible();
  await expect(page.getByText(/surge/i)).toHaveCount(0);
}

/** Wait for road-distance quote then book cash ride. */
export async function bookCashRide(page: Page) {
  await fillRiderContact(page);
  await assertCashAndNoSurge(page);

  const price = page.getByTestId("price-display").first();
  await expect(price).toBeVisible({ timeout: 20_000 });
  await expect(price).toContainText(/R\s*\d+/i);

  const book = page.getByTestId("book-button").first();
  await expect(book).toBeEnabled({ timeout: 25_000 });
  await book.scrollIntoViewIfNeeded();
  await book.click();

  await page.waitForURL(/\/trip\/RU-/i, { timeout: 30_000 });
  return { tripUrl: page.url() };
}

/** Waiting / searching screen after request. */
export async function expectFindingDriver(page: Page) {
  await expect(
    page.getByText(/Finding your driver/i).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText(/Offering to the best-matched online driver/i),
  ).toBeVisible();
}

/** After accept: driver card + ETA chrome. */
export async function expectDriverAssigned(
  page: Page,
  driverName = testUsers.driver.name,
) {
  // Avoid matching the always-visible stepper labels ("On the way").
  await expect
    .poll(
      async () => {
        const body = await page.locator("main").innerText();
        return /Pick-up in|Confirmed|driver on the way/i.test(body)
          && body.includes(driverName.split(" ")[0]);
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  await expect(page.getByText(driverName).first()).toBeVisible({
    timeout: 10_000,
  });
}

/** Live Mapbox trip map (not OSM iframe). */
export async function expectLiveTripMap(page: Page) {
  await expect(page.locator("[data-testid=\"ride-map\"]")).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByText(/Live driver location|Pickup to drop-off/i).first(),
  ).toBeVisible({ timeout: 10_000 });
}

export async function rateDriver(page: Page, stars = 5) {
  await expect(page.getByText(/Rate your driver/i)).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: String(stars) }).click();
  await page.getByRole("button", { name: /Submit rating/i }).click();
  await expect(page.getByText(/You rated/i)).toBeVisible({
    timeout: 15_000,
  });
}

export { testLocations, testUsers, rideBookingUrl };
