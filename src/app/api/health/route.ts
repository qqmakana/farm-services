import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public health check for uptime monitors. */
export async function GET() {
  const started = Date.now();
  let db: "ok" | "skip" | "error" = "skip";
  let dbMs = 0;

  if (isSupabaseConfigured() && hasServiceRole()) {
    const t0 = Date.now();
    try {
      const admin = createAdminClient();
      const { error } = await admin.from("rr_profiles").select("id").limit(1);
      db = error ? "error" : "ok";
      dbMs = Date.now() - t0;
    } catch {
      db = "error";
      dbMs = Date.now() - t0;
    }
  }

  const body = {
    ok: db !== "error",
    service: "village-ride",
    time: new Date().toISOString(),
    ms: Date.now() - started,
    db,
    dbMs,
    fcm: Boolean(
      process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY,
    ),
  };

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
  });
}
