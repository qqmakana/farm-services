import { createAdminClient } from "./supabase/admin";
import { distanceKm } from "./geo";
import {
  driverNicheScore,
  filterDriversByOptIn,
  jobNeedsFromJob,
} from "./job-needs";
import { vehicleFitsJob } from "./vehicles";
import type { Job, VehicleType } from "./types";

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

/** Broadcast offers to niche-matching online drivers + auto-assign best fit. */
export async function matchJobAfterCreate(jobId: string) {
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error || !job) throw new Error(error?.message ?? "Job not found");

  const needs = jobNeedsFromJob(job as Job);

  const { data: drivers } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("is_active", true)
    .eq("is_online", true);

  const vehicleOk = (drivers ?? []).filter(
    (d) =>
      d.approval_status !== "rejected" &&
      (d.approval_status == null || d.approval_status === "approved") &&
      vehicleFitsJob(d.vehicle_type, job.required_vehicle as VehicleType),
  );

  const candidates = filterDriversByOptIn(vehicleOk, needs);

  const now = new Date().toISOString();
  await admin.from("rr_jobs").update({ offered_at: now }).eq("id", jobId);

  for (const d of candidates) {
    await admin.from("rr_job_applications").upsert(
      {
        job_id: jobId,
        driver_id: d.id,
        status: "pending",
      },
      { onConflict: "job_id,driver_id" },
    );
  }

  const withGps = candidates.filter(
    (d) => d.last_lat != null && d.last_lng != null,
  );
  if (withGps.length === 0) return job as Job;

  let best = withGps[0];
  let bestScore = -Infinity;
  let bestDist = Infinity;

  for (const d of withGps) {
    const niche = driverNicheScore(d, needs);
    let dist = 0;
    if (job.pickup_lat != null && job.pickup_lng != null) {
      dist = distanceKm(
        { lat: d.last_lat, lng: d.last_lng },
        { lat: job.pickup_lat, lng: job.pickup_lng },
      );
    }
    // Prefer niche fit, then closer driver
    if (
      niche > bestScore ||
      (niche === bestScore && dist < bestDist)
    ) {
      bestScore = niche;
      bestDist = dist;
      best = d;
    }
  }

  const { data: assigned } = await admin
    .from("rr_jobs")
    .update({
      driver_id: best.id,
      status: "assigned",
      assigned_at: now,
      driver_lat: best.last_lat,
      driver_lng: best.last_lng,
      driver_location_at: best.last_location_at ?? now,
    })
    .eq("id", jobId)
    .eq("status", "new")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .maybeSingle();

  if (assigned) {
    await admin
      .from("rr_job_applications")
      .update({ status: "accepted" })
      .eq("job_id", jobId)
      .eq("driver_id", best.id);
    await admin
      .from("rr_job_applications")
      .update({ status: "rejected" })
      .eq("job_id", jobId)
      .eq("status", "pending")
      .neq("driver_id", best.id);
  }

  return assigned ?? job;
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
