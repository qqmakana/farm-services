import { NextResponse } from "next/server";
import { recordRecentDestination } from "@/lib/actions-suggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    phone?: string;
    ride_id?: string;
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    countryCode?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const phone = String(body.phone || "").trim();
  const name = String(body.name || "").trim();
  if (!phone || !name) {
    return NextResponse.json(
      { error: "phone and name are required" },
      { status: 400 },
    );
  }
  await recordRecentDestination({
    phone,
    name,
    address: body.address,
    lat: body.lat,
    lng: body.lng,
    countryCode: body.countryCode,
    jobId: body.ride_id,
  });
  return NextResponse.json({ ok: true });
}
