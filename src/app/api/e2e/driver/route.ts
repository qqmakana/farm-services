import { NextResponse } from "next/server";
import { mockRepo } from "@/lib/mock-store";

/**
 * E2E-only helpers. Enabled when VILLAGE_RIDE_USE_MOCK=1.
 * Lets Playwright assert FCM registration & wallet without scraping private store.
 */
function e2eEnabled() {
  return process.env.VILLAGE_RIDE_USE_MOCK === "1";
}

export async function GET(request: Request) {
  if (!e2eEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get("driverId");
  if (!driverId) {
    return NextResponse.json({ error: "driverId required" }, { status: 400 });
  }
  const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: driver.id,
    full_name: driver.full_name,
    is_online: driver.is_online,
    fcm_token: driver.fcm_token ?? null,
    wallet_balance: driver.wallet_balance ?? 0,
    commission_owed: driver.commission_owed ?? 0,
    vehicle_type: driver.vehicle_type,
  });
}

export async function POST(request: Request) {
  if (!e2eEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await request.json()) as {
    driverId?: string;
    fcmToken?: string;
  };
  if (!body.driverId || !body.fcmToken) {
    return NextResponse.json(
      { error: "driverId and fcmToken required" },
      { status: 400 },
    );
  }
  const driver = mockRepo.listDrivers().find((d) => d.id === body.driverId);
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  driver.fcm_token = body.fcmToken;
  driver.fcm_updated_at = new Date().toISOString();
  return NextResponse.json({
    ok: true,
    fcm_token: driver.fcm_token,
  });
}
