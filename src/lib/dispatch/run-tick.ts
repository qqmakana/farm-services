import { expireStaleOffers } from "@/lib/dispatch/offer-chain";
import { matchJobAfterCreate } from "@/lib/matching";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export type DispatchTickSource = "cron" | "client" | "unknown";

export type DispatchTickResult = {
  ok: true;
  expired: number;
  priorityRematched: number;
  mode: "live" | "local";
  source: DispatchTickSource;
};

/**
 * Expire timed-out exclusive offers and cascade to the next ranked driver.
 * Also re-kick searching jobs that have no active offer (Village Pass first).
 */
export async function runDispatchTick(
  source: DispatchTickSource,
): Promise<DispatchTickResult> {
  if (!hasServiceRole()) {
    console.log("[dispatch] tick skipped (no service role)", { source });
    return {
      ok: true,
      expired: 0,
      priorityRematched: 0,
      mode: "local",
      source,
    };
  }

  const expired = await expireStaleOffers();

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

  console.log("[dispatch] tick", {
    source,
    expired,
    priorityRematched,
    mode: "live",
  });

  return {
    ok: true,
    expired,
    priorityRematched,
    mode: "live",
    source,
  };
}

/** Resolve who triggered the tick (Vercel Cron sends Bearer CRON_SECRET). */
export function resolveDispatchTickSource(request: Request): DispatchTickSource {
  const url = new URL(request.url);
  const q = url.searchParams.get("source");
  if (q === "cron" || q === "client") return q;

  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth === `Bearer ${secret}`) return "cron";
  }

  // Vercel Cron User-Agent when CRON_SECRET is unset
  const ua = request.headers.get("user-agent") ?? "";
  if (/vercel-cron/i.test(ua)) return "cron";

  return "unknown";
}
