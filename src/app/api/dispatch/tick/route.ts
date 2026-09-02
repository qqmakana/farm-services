import { NextResponse } from "next/server";
import {
  resolveDispatchTickSource,
  runDispatchTick,
} from "@/lib/dispatch/run-tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Expire timed-out driver offers and cascade to the next ranked driver.
 *
 * Triggered by:
 * - GitHub Actions every 5 minutes (Vercel Hobby cannot cron this often)
 * - Rider trip page poll while searching (Hobby-safe backup)
 */
async function handle(request: Request) {
  const source = resolveDispatchTickSource(request);
  const result = await runDispatchTick(source);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
