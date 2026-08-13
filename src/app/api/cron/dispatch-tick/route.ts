import { NextResponse } from "next/server";
import { runDispatchTick } from "@/lib/dispatch/run-tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron entry — every minute.
 * Auth: Authorization: Bearer $CRON_SECRET (same pattern as partner-weekly).
 * Vercel injects this header when CRON_SECRET is set on the project.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await runDispatchTick("cron");
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
