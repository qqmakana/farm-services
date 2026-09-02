import { NextResponse } from "next/server";
import { runDispatchTick } from "@/lib/dispatch/run-tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side dispatch cascade (no rider client required).
 *
 * Triggered by GitHub Actions every 5 minutes (Hobby Vercel cannot
 * schedule sub-daily crons). Auth: Authorization: Bearer $CRON_SECRET.
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
  try {
    const { maybeNotifyLowDriverCount } = await import("@/lib/notifications");
    await maybeNotifyLowDriverCount();
  } catch {
    /* dispatch tick already ran */
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
