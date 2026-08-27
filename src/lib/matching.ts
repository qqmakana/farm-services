import { offerNextDriver } from "./dispatch/offer-chain";
import { rankDriversWithExpandingRadius } from "./dispatch-score";
import { jobNeedsFromJob } from "./job-needs";
import { incrementDriverOfferStat } from "./matching-stats";
import { createAdminClient } from "./supabase/admin";
import type { Driver, Job, VehicleType } from "./types";
import { driverEligibleForDispatch } from "./wallet";

export { incrementDriverOfferStat };

function refCode() {
  return `RU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function getFareRule(
  vehicle: VehicleType,
  countryCode = "ZA",
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_fare_rules")
    .select("*")
    .eq("vehicle_type", vehicle)
    .eq("country_code", countryCode)
    .maybeSingle();
  if (data) return data;

  // Legacy rows often have no country_code — only reuse them for ZA so
  // other markets fall through to country.pricing (not ZA rand amounts).
  if (countryCode === "ZA") {
    const { data: legacy } = await admin
      .from("rr_fare_rules")
      .select("*")
      .eq("vehicle_type", vehicle)
      .maybeSingle();
    return legacy;
  }
  return null;
}

/**
 * Smart dispatch: rank online drivers, store the queue, offer exclusively
 * to #1 with free FCM push + 30s window. Driver must ACCEPT (no auto-assign).
 */
export async function matchJobAfterCreate(jobId: string) {
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error || !job) throw new Error(error?.message ?? "Job not found");

  const typedJob = job as Job;
  const needs = jobNeedsFromJob(typedJob);
  const required = typedJob.required_vehicle as VehicleType;
  const jobCountry = typedJob.country_code || "ZA";
  const pickup =
    typedJob.pickup_lat != null && typedJob.pickup_lng != null
      ? { lat: typedJob.pickup_lat, lng: typedJob.pickup_lng }
      : null;

  let driversQuery = admin
    .from("rr_drivers")
    .select("*")
    .eq("is_active", true)
    .eq("is_online", true);

  // Prefer same-country drivers; fall back if column missing on older DBs
  const { data: driversSame, error: countryErr } = await driversQuery.eq(
    "country_code",
    jobCountry,
  );

  let drivers = driversSame;
  if (countryErr) {
    const { data: allOnline } = await admin
      .from("rr_drivers")
      .select("*")
      .eq("is_active", true)
      .eq("is_online", true);
    drivers = allOnline;
  }

  const approved = ((drivers ?? []) as Driver[]).filter(
    (d) =>
      d.approval_status !== "rejected" &&
      (d.approval_status == null || d.approval_status === "approved") &&
      driverEligibleForDispatch(d) &&
      (!d.country_code || d.country_code === jobCountry),
  );

  const { ranked, matchRadiusKm } = rankDriversWithExpandingRadius({
    drivers: approved,
    requiredVehicle: required,
    needs,
    pickup,
  });

  const rankIds = ranked.map((r) => r.driver.id);
  const top = ranked[0];

  // Village Pass: priority_score=1 — dispatch these requests ahead of standard jobs
  const priority = Number((typedJob as Job & { priority_score?: number }).priority_score) || 0;
  const baseScore = top?.score ?? 0;

  await admin
    .from("rr_jobs")
    .update({
      status: "searching_driver",
      dispatch_rank: rankIds,
      dispatch_index: 0,
      dispatch_attempts: 0,
      dispatch_exhausted: false,
      offered_driver_id: null,
      offer_expires_at: null,
      offered_at: new Date().toISOString(),
      // Boost stored match_score so ops / queues can sort Pass jobs first
      match_score: baseScore + (priority > 0 ? 1000 : 0),
      match_breakdown: top?.breakdown
        ? {
            ...top.breakdown,
            village_pass_priority: priority,
            match_radius_km: matchRadiusKm,
          }
        : { village_pass_priority: priority, match_radius_km: matchRadiusKm },
    })
    .eq("id", jobId)
    .in("status", ["searching_driver", "new"]);

  if (rankIds.length === 0) {
    console.log("[dispatch] no online drivers for", jobId);
    await admin
      .from("rr_jobs")
      .update({
        dispatch_exhausted: true,
        dispatcher_notes: [
          typedJob.dispatcher_notes,
          "No online drivers available",
        ]
          .filter(Boolean)
          .join(" · "),
      })
      .eq("id", jobId);
    return { ...typedJob, dispatch_exhausted: true, status: "searching_driver" };
  }

  return (await offerNextDriver(jobId)) ?? typedJob;
}

function missingColumnName(error: {
  message?: string;
  details?: string;
  hint?: string;
}): string | null {
  const blob = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  const quoted = blob.match(/'([a-z_][a-z0-9_]*)' column/i);
  if (quoted) return quoted[1];
  const pg = blob.match(/column "([a-z_][a-z0-9_]*)"/i);
  return pg?.[1] ?? null;
}

async function insertJobRow(
  admin: ReturnType<typeof createAdminClient>,
  row: Record<string, unknown>,
) {
  const payload: Record<string, unknown> = { ...row };
  delete payload.booking_fee;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await admin
      .from("rr_jobs")
      .insert(payload)
      .select("*, drivers:rr_drivers!driver_id(*), shops:rr_shops(*)")
      .single();
    if (!error && data) return data;
    const col = error ? missingColumnName(error) : null;
    if (!col || !(col in payload)) {
      throw new Error(error?.message ?? "Could not create your trip.");
    }
    delete payload[col];
  }
  throw new Error("Could not create your trip.");
}

export async function insertPaidJob(row: Record<string, unknown>) {
  const admin = createAdminClient();
  const code = (row.reference_code as string) || refCode();

  if (row.paypal_capture_id) {
    const { data: existing } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers!driver_id(*), shops:rr_shops(*)")
      .eq("paypal_capture_id", row.paypal_capture_id)
      .maybeSingle();
    if (existing) return existing;
  }
  if (row.paypal_order_id) {
    const { data: existing } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers!driver_id(*), shops:rr_shops(*)")
      .eq("paypal_order_id", row.paypal_order_id)
      .maybeSingle();
    if (existing) return existing;
  }

  const data = await insertJobRow(admin, { ...row, reference_code: code });
  try {
    await matchJobAfterCreate(data.id);
  } catch {
    /* Job is saved — dispatch can retry. Never fail the rider booking. */
  }
  const { data: fresh } = await admin
    .from("rr_jobs")
    .select("*, drivers:rr_drivers!driver_id(*), shops:rr_shops(*)")
    .eq("id", data.id)
    .single();
  return fresh ?? data;
}
