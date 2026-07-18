import { NextResponse } from "next/server";
import { expireStaleOffers } from "@/lib/dispatch/offer-chain";
import { hasServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Expire timed-out driver offers and cascade to the next ranked driver.
 * Call from the driver/customer UI poll, or a free cron (e.g. every minute).
 */
export async function POST() {
  if (!hasServiceRole()) {
    return NextResponse.json({ ok: true, expired: 0, mode: "local" });
  }
  const expired = await expireStaleOffers();
  return NextResponse.json({ ok: true, expired });
}

export async function GET() {
  return POST();
}
