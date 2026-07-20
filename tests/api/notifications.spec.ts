import { test, expect } from "@playwright/test";
import { isProductionBase } from "../helpers/auth-helper";

test.describe("API — notifications / FCM channel", () => {
  test("mock FCM registration round-trip", async ({ request, baseURL }) => {
    test.skip(isProductionBase(baseURL), "Mock-only");
    const token = `notify-${Date.now()}`;
    const res = await request.post("/api/e2e/driver", {
      data: { driverId: "d1", fcmToken: token },
    });
    expect(res.ok()).toBeTruthy();
    const check = await request.get("/api/e2e/driver?driverId=d1");
    const json = await check.json();
    expect(json.fcm_token).toBe(token);
  });
});
