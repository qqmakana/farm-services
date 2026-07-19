import { offerNextDriver } from "./dispatch/offer-chain";
import { rankDriversForJob } from "./dispatch-score";
import { jobNeedsFromJob } from "./job-needs";
import { incrementDriverOfferStat } from "./matching-stats";
import { createAdminClient } from "./supabase/admin";
import type { Driver, Job, VehicleType } from "./types";
import { driverEligibleForDispatch } from "./wallet";

export { incrementDriverOfferStat };

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
      (d.approval_status == null || d.approval_status === "approved") &&
      driverEligibleForDispatch(d),
  );

  const ranked = rankDriversForJob({
    drivers: approved,
    requiredVehicle: required,
    needs,
    pickup,
  });

  const rankIds = ranked.map((r) => r.driver.id);
  const top = ranked[0];

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
      match_score: top?.score ?? null,
      match_breakdown: top?.breakdown ?? null,
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

  const { data, error } = await admin
    .from("rr_jobs")
    .insert({ ...row, reference_code: code })
    .select("*, drivers:rr_drivers!driver_id(*), shops:rr_shops(*)")
    .single();

  if (error) throw new Error(error.message);
  await matchJobAfterCreate(data.id);
  const { data: fresh } = await admin
    .from("rr_jobs")
    .select("*, drivers:rr_drivers!driver_id(*), shops:rr_shops(*)")
    .eq("id", data.id)
    .single();
  return fresh ?? data;
}
