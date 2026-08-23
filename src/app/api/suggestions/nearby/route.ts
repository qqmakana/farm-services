import { NextResponse } from "next/server";
import { getNearbySuggestions } from "@/lib/actions-suggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    lat?: number;
    lng?: number;
    phone?: string;
    countryCode?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng);
  const payload = await getNearbySuggestions({
    lat: hasPin ? lat : null,
    lng: hasPin ? lng : null,
    phone: body.phone,
    countryCode: body.countryCode,
  });
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
