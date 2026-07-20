import { test, expect } from "@playwright/test";
import { isProductionBase } from "../helpers/auth-helper";
import { generateReferralCode } from "../helpers/data-generators";

test.describe("API — e2e driver + referrals", () => {
  test("e2e driver endpoint requires mock mode", async ({ request, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock-only API");

    const get = await request.get("/api/e2e/driver?driverId=d1");
    expect(get.ok()).toBeTruthy();
    const body = await get.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("wallet_balance");
  });

  test("e2e driver can set FCM token", async ({ request, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock-only API");

    const token = `api-test-fcm-${Date.now()}`;
    const res = await request.post("/api/e2e/driver", {
      data: { driverId: "d1", fcmToken: token },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.fcm_token).toBe(token);
  });

  test("referral code formula matches product spec", () => {
    const code = generateReferralCode("Mthatha Appliances");
    expect(code.startsWith("MTHA")).toBeTruthy();
    expect(code.length).toBe(7);
  });

  test("partner weekly cron responds", async ({ request, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Avoid hammering prod cron");
    const res = await request.get("/api/cron/partner-weekly");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBeTruthy();
  });

  test("dispatch tick responds", async ({ request }) => {
    const res = await request.get("/api/dispatch/tick");
    expect(res.ok()).toBeTruthy();
  });
});
