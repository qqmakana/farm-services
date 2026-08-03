import { NextResponse } from "next/server";
import { expireStaleOffers } from "@/lib/dispatch/offer-chain";
import { matchJobAfterCreate } from "@/lib/matching";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Expire timed-out driver offers and cascade to the next ranked driver.
 * Also re-kick Village Pass (priority_score=1) searching jobs first.
 */
export async function POST() {
  if (!hasServiceRole()) {
    return NextResponse.json({ ok: true, expired: 0, mode: "local" });
  }
  const expired = await expireStaleOffers();

  // Priority matching: Pass jobs waiting without an active offer get rematched first
  let priorityRematched = 0;
  try {
    const admin = createAdminClient();
    const { data: waiting } = await admin
      .from("rr_jobs")
      .select("id")
      .in("status", ["searching_driver", "new"])
      .is("offered_driver_id", null)
      .order("priority_score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(5);
    for (const row of waiting ?? []) {
      await matchJobAfterCreate(row.id);
      priorityRematched += 1;
    }
  } catch {
    /* column may be missing until VILLAGE_PASS.sql is run */
  }

  return NextResponse.json({ ok: true, expired, priorityRematched });
}

export async function GET() {
  return POST();
}
