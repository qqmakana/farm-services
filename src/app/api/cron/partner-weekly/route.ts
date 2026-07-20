import { NextResponse } from "next/server";
import { generateAllPartnerWeeklyReports } from "@/lib/partner";
import { hasServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly partner reports — free Vercel cron / manual GET.
 * Auth: Authorization: Bearer $CRON_SECRET (optional if unset in local).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  if (!hasServiceRole() && process.env.VILLAGE_RIDE_USE_MOCK !== "1") {
    // Still allow mock path for local
  }

  const results = await generateAllPartnerWeeklyReports();
  return NextResponse.json({
    ok: true,
    generated: results.filter((r) => r.created).length,
    shops: results.length,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
