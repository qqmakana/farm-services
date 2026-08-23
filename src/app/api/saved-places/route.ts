import { NextResponse } from "next/server";
import { upsertPersonalPlace } from "@/lib/actions-locations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    phone?: string;
    label?: string;
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
  if (!phone) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }
  const kind = String(body.label || "other").toLowerCase();
  const place = await upsertPersonalPlace({
    guest_phone: phone,
    name: String(body.name || body.address || "Saved place").trim(),
    label: String(body.address || body.name || "").trim(),
    latitude: body.lat ?? null,
    longitude: body.lng ?? null,
    is_home: kind === "home",
    is_work: kind === "work",
    is_farm: kind === "farm",
    country_code: body.countryCode,
  });
  return NextResponse.json({ ok: true, place });
}
