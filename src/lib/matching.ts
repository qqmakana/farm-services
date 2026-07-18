import { createAdminClient } from "./supabase/admin";
import { rankDriversForJob } from "./dispatch-score";
import { jobNeedsFromJob } from "./job-needs";
import type { Driver, Job, VehicleType } from "./types";

function refCode() {
  return `RU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function getFareRule(vehicle: VehicleType) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_fare_rules")
    .select("*")
    .eq("vehicle_type", vehicle)
    .maybeSingle();
  return data;
}

export async function incrementDriverOfferStat(
  driverId: string,
  field: "offers_received" | "offers_accepted" | "offers_declined",
  by = 1,
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_drivers")
    .select(field)
    .eq("id", driverId)
    .maybeSingle();
  const current = Number((data as Record<string, number> | null)?.[field]) || 0;
  await admin
    .from("rr_drivers")
    .update({ [field]: current + by })
    .eq("id", driverId);
}

/**
 * Smart dispatch: rank online drivers by composite score
 * (vehicle · opt-in · rating · acceptance · proximity · verified),
 * offer to eligible pool, auto-assign highest score.
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
  const pickup =
    typedJob.pickup_lat != null && typedJob.pickup_lng != null
      ? { lat: typedJob.pickup_lat, lng: typedJob.pickup_lng }
      : null;

  const { data: drivers } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("is_active", true)
    .eq("is_online", true);

  const approved = ((drivers ?? []) as Driver[]).filter(
    (d) =>
      d.approval_status !== "rejected" &&
      (d.approval_status == null || d.approval_status === "approved"),
  );

  const ranked = rankDriversForJob({
    drivers: approved,
    requiredVehicle: required,
    needs,
    pickup,
  });

  const now = new Date().toISOString();
  await admin.from("rr_jobs").update({ offered_at: now }).eq("id", jobId);

  // Offer to top scorers (cap keeps offer noise down as fleet grows)
  const offerPool = ranked.slice(0, 12);

  for (const { driver } of offerPool) {
    await admin.from("rr_job_applications").upsert(
      {
        job_id: jobId,
        driver_id: driver.id,
        status: "pending",
      },
      { onConflict: "job_id,driver_id" },
    );
    await incrementDriverOfferStat(driver.id, "offers_received");
  }

  const winner = offerPool[0];
  if (!winner) return typedJob;

  const { data: assigned } = await admin
    .from("rr_jobs")
    .update({
      driver_id: winner.driver.id,
      status: "assigned",
      assigned_at: now,
      driver_lat: winner.driver.last_lat,
      driver_lng: winner.driver.last_lng,
      driver_location_at: winner.driver.last_location_at ?? now,
      match_score: winner.score,
      match_breakdown: winner.breakdown,
    })
    .eq("id", jobId)
    .eq("status", "new")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .maybeSingle();

  if (assigned) {
    await incrementDriverOfferStat(winner.driver.id, "offers_accepted");
    await admin
      .from("rr_job_applications")
      .update({ status: "accepted" })
      .eq("job_id", jobId)
      .eq("driver_id", winner.driver.id);
    await admin
      .from("rr_job_applications")
      .update({ status: "rejected" })
      .eq("job_id", jobId)
      .eq("status", "pending")
      .neq("driver_id", winner.driver.id);
  }

  return assigned ?? typedJob;
}

export async function insertPaidJob(row: Record<string, unknown>) {
  const admin = createAdminClient();
  const code = (row.reference_code as string) || refCode();

  if (row.paypal_capture_id) {
    const { data: existing } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
      .eq("paypal_capture_id", row.paypal_capture_id)
      .maybeSingle();
    if (existing) return existing;
  }
  if (row.paypal_order_id) {
    const { data: existing } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
      .eq("paypal_order_id", row.paypal_order_id)
      .maybeSingle();
    if (existing) return existing;
  }

  const { data, error } = await admin
    .from("rr_jobs")
    .insert({ ...row, reference_code: code })
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .single();

  if (error) throw new Error(error.message);
  await matchJobAfterCreate(data.id);
  const { data: fresh } = await admin
    .from("rr_jobs")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .eq("id", data.id)
    .single();
  return fresh ?? data;
}
