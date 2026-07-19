import { sendPushToToken } from "@/lib/firebase/admin";
import { SERVICE_LABELS, VEHICLE_LABELS } from "@/lib/format";
import {
  isSearchingStatus,
  MAX_DISPATCH_ATTEMPTS,
} from "@/lib/job-status";
import { incrementDriverOfferStat } from "@/lib/matching-stats";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Driver, Job, VehicleType } from "@/lib/types";
import { driverEligibleForDispatch } from "@/lib/wallet";

/** Exclusive offer window before cascading to the next-ranked driver. */
export const OFFER_TIMEOUT_SEC = 30;

export function buildDriverOfferPush(job: Job) {
  const service = SERVICE_LABELS[job.service_type];
  const price = Math.round(Number(job.fee_amount));
  return {
    title: "New Job Available",
    body: `${service}: ${job.pickup_landmark} → ${job.dropoff_landmark} | R${price}`,
    data: {
      booking_id: job.id,
      jobId: job.id,
      reference: job.reference_code,
      url: "/driver",
      type: "job_offer",
    },
  };
}

export function buildCustomerConfirmPush(job: Job, driver: Driver) {
  const vehicle =
    VEHICLE_LABELS[driver.vehicle_type as VehicleType] ?? driver.vehicle_type;
  return {
    title: "✅ Driver Confirmed!",
    body: `${driver.full_name.split(" ")[0]} (${vehicle}) is on the way. Ref ${job.reference_code}`,
    data: {
      booking_id: job.id,
      jobId: job.id,
      reference: job.reference_code,
      url: `/trip/${job.reference_code}`,
      type: "job_confirmed",
    },
  };
}

async function markDispatchExhausted(jobId: string, notes: string | null) {
  const admin = createAdminClient();
  await admin
    .from("rr_jobs")
    .update({
      offered_driver_id: null,
      offer_expires_at: null,
      dispatch_exhausted: true,
      dispatcher_notes: [notes, "No drivers available after 3 offer attempts"]
        .filter(Boolean)
        .join(" · "),
    })
    .eq("id", jobId)
    .in("status", ["searching_driver", "new"]);
}

/**
 * Offer exclusively to next ranked driver + free FCM push.
 * Status stays searching_driver until ACCEPT → confirmed.
 */
export async function offerNextDriver(jobId: string): Promise<Job | null> {
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error || !job) throw new Error(error?.message ?? "Job not found");

  const typed = job as Job;
  if (!isSearchingStatus(typed.status)) return typed;
  if (typed.dispatch_exhausted) return typed;

  const attempts = Number(typed.dispatch_attempts) || 0;
  if (attempts >= MAX_DISPATCH_ATTEMPTS) {
    await markDispatchExhausted(jobId, typed.dispatcher_notes);
    return { ...typed, dispatch_exhausted: true };
  }

  const rank = Array.isArray(typed.dispatch_rank)
    ? (typed.dispatch_rank as string[])
    : [];

  const { data: declinedRows } = await admin
    .from("rr_job_applications")
    .select("driver_id")
    .eq("job_id", jobId)
    .in("status", ["withdrawn", "rejected"]);

  const skip = new Set((declinedRows ?? []).map((r) => r.driver_id as string));
  if (typed.offered_driver_id) skip.add(typed.offered_driver_id);

  let start = Math.max(0, Number(typed.dispatch_index) || 0);

  for (let i = start; i < rank.length; i++) {
    const driverId = rank[i];
    if (!driverId || skip.has(driverId)) continue;

    const { data: driver } = await admin
      .from("rr_drivers")
      .select("*")
      .eq("id", driverId)
      .maybeSingle();

    if (!driver || !driver.is_online || !driver.is_active) continue;
    if (!driverEligibleForDispatch(driver as Driver)) continue;
    if (
      driver.approval_status === "rejected" ||
      (driver.approval_status != null && driver.approval_status !== "approved")
    ) {
      continue;
    }

    const now = new Date();
    const expires = new Date(now.getTime() + OFFER_TIMEOUT_SEC * 1000);
    const nextAttempts = attempts + 1;

    const { data: updated, error: upErr } = await admin
      .from("rr_jobs")
      .update({
        status: "searching_driver",
        offered_driver_id: driverId,
        offer_expires_at: expires.toISOString(),
        offered_at: now.toISOString(),
        dispatch_index: i,
        dispatch_attempts: nextAttempts,
        dispatch_exhausted: false,
      })
      .eq("id", jobId)
      .in("status", ["searching_driver", "new"])
      .select("*")
      .maybeSingle();

    if (upErr || !updated) return typed;

    await admin.from("rr_job_applications").upsert(
      {
        job_id: jobId,
        driver_id: driverId,
        status: "pending",
      },
      { onConflict: "job_id,driver_id" },
    );
    await incrementDriverOfferStat(driverId, "offers_received");

    await sendPushToToken(
      (driver as Driver).fcm_token,
      buildDriverOfferPush(updated as Job),
    );

    console.log("[dispatch] offered + FCM", {
      jobId,
      driverId,
      attempt: nextAttempts,
      expires: expires.toISOString(),
    });

    return updated as Job;
  }

  await markDispatchExhausted(jobId, typed.dispatcher_notes);
  console.log("[dispatch] exhausted ranked drivers", jobId);
  return { ...typed, dispatch_exhausted: true };
}

/** Expire timed-out exclusive offers and cascade (max 3 attempts). */
export async function expireStaleOffers(limit = 20): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: stale } = await admin
    .from("rr_jobs")
    .select("id, offered_driver_id, status")
    .in("status", ["searching_driver", "new"])
    .not("offered_driver_id", "is", null)
    .lt("offer_expires_at", now)
    .limit(limit);

  let n = 0;
  for (const row of stale ?? []) {
    const jobId = row.id as string;
    const driverId = row.offered_driver_id as string | null;
    if (driverId) {
      await admin
        .from("rr_job_applications")
        .update({ status: "withdrawn" })
        .eq("job_id", jobId)
        .eq("driver_id", driverId)
        .eq("status", "pending");
      await incrementDriverOfferStat(driverId, "offers_declined");
    }
    const { data: job } = await admin
      .from("rr_jobs")
      .select("dispatch_index")
      .eq("id", jobId)
      .single();
    await admin
      .from("rr_jobs")
      .update({
        offered_driver_id: null,
        offer_expires_at: null,
        dispatch_index: (Number(job?.dispatch_index) || 0) + 1,
      })
      .eq("id", jobId)
      .in("status", ["searching_driver", "new"]);

    await offerNextDriver(jobId);
    n += 1;
  }
  return n;
}
