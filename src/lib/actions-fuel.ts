"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_COUNTRY } from "./countries";
import { sendPushToToken } from "./firebase/admin";
import { distanceKm } from "./geo";
import { mockRepo } from "./mock-store";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/server";
import type {
  CreateFuelRequestInput,
  FuelRequest,
} from "./types";

const FUEL_RADIUS_KM = 25;

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function revalidateFuel() {
  revalidatePath("/driver/home");
  revalidatePath("/driver/jobs");
  revalidatePath("/dispatch");
}

async function notifyNearbyHelpers(req: FuelRequest) {
  if (req.location_lat == null || req.location_lng == null) return;

  const origin = { lat: req.location_lat, lng: req.location_lng };
  const landmark = req.location_landmark?.trim() || "nearby landmark";

  if (!useAdmin()) {
    const helpers = mockRepo
      .listDrivers()
      .filter(
        (d) =>
          d.id !== req.requester_driver_id &&
          d.is_online &&
          d.is_active &&
          d.last_lat != null &&
          d.last_lng != null &&
          distanceKm(origin, { lat: d.last_lat, lng: d.last_lng }) <=
            FUEL_RADIUS_KM,
      );
    for (const h of helpers.slice(0, 8)) {
      await sendPushToToken(h.fcm_token, {
        title: "⛽ Out of fuel — help nearby?",
        body: `Need ${req.fuel_amount} · ${landmark}`,
        data: {
          type: "fuel_help",
          fuel_request_id: req.id,
          url: "/driver/home",
        },
      });
    }
    return;
  }

  const admin = createAdminClient();
  const { data: drivers } = await admin
    .from("rr_drivers")
    .select("id, fcm_token, last_lat, last_lng, is_online, is_active")
    .eq("is_online", true)
    .eq("is_active", true)
    .neq("id", req.requester_driver_id)
    .not("last_lat", "is", null)
    .not("last_lng", "is", null)
    .limit(80);

  const nearby = (drivers ?? [])
    .filter(
      (d) =>
        d.last_lat != null &&
        d.last_lng != null &&
        distanceKm(origin, {
          lat: Number(d.last_lat),
          lng: Number(d.last_lng),
        }) <= FUEL_RADIUS_KM,
    )
    .slice(0, 12);

  await Promise.all(
    nearby.map((d) =>
      sendPushToToken(d.fcm_token as string | null, {
        title: "⛽ Out of fuel — help nearby?",
        body: `Need ${req.fuel_amount} · ${landmark}`,
        data: {
          type: "fuel_help",
          fuel_request_id: req.id,
          url: "/driver/home",
        },
      }),
    ),
  );
}

export async function createFuelRequest(
  input: CreateFuelRequestInput,
): Promise<FuelRequest> {
  const amount = input.fuel_amount;
  if (!["5L", "10L", "20L"].includes(amount)) {
    throw new Error("Choose 5L, 10L, or 20L.");
  }
  if (!input.driver_id) throw new Error("Driver required.");

  const landmark = input.location_landmark?.trim() || null;
  const hasPin =
    input.location_lat != null &&
    input.location_lng != null &&
    Number.isFinite(input.location_lat) &&
    Number.isFinite(input.location_lng);
  if (!hasPin && (!landmark || landmark.length < 3)) {
    throw new Error(
      "Share GPS or describe where you are (e.g. “near clinic gate”).",
    );
  }

  if (!useAdmin()) {
    const row = mockRepo.createFuelRequest({
      ...input,
      location_landmark: landmark,
      location_lat: hasPin ? input.location_lat! : null,
      location_lng: hasPin ? input.location_lng! : null,
    });
    await notifyNearbyHelpers(row);
    revalidateFuel();
    return row;
  }

  const admin = createAdminClient();
  const { data: open } = await admin
    .from("rr_fuel_requests")
    .select("id")
    .eq("requester_driver_id", input.driver_id)
    .in("status", ["pending", "assigned"])
    .limit(1);
  if (open?.length) {
    throw new Error("You already have an open fuel request.");
  }

  const { data, error } = await admin
    .from("rr_fuel_requests")
    .insert({
      requester_driver_id: input.driver_id,
      location_lat: hasPin ? input.location_lat : null,
      location_lng: hasPin ? input.location_lng : null,
      location_landmark: landmark,
      fuel_amount: amount,
      status: "pending",
      payment_method: input.payment_method === "card" ? "card" : "cash",
      payment_note: "Pay the helper in cash for fuel + small tip if agreed.",
      country_code: input.country_code || DEFAULT_COUNTRY,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const row = data as FuelRequest;
  await notifyNearbyHelpers(row);
  revalidateFuel();
  return row;
}

export async function listMyFuelRequest(
  driverId: string,
): Promise<FuelRequest | null> {
  if (!useAdmin()) return mockRepo.listMyFuelRequest(driverId);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_fuel_requests")
    .select(
      "*, requester:rr_drivers!rr_fuel_requests_requester_driver_id_fkey(id, full_name, phone), helper:rr_drivers!rr_fuel_requests_helper_driver_id_fkey(id, full_name, phone)",
    )
    .eq("requester_driver_id", driverId)
    .in("status", ["pending", "assigned"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    // Fallback without joins if FK names differ
    const { data: plain } = await admin
      .from("rr_fuel_requests")
      .select("*")
      .eq("requester_driver_id", driverId)
      .in("status", ["pending", "assigned"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (plain as FuelRequest) ?? null;
  }
  return (data as FuelRequest) ?? null;
}

export async function listNearbyFuelHelp(
  helperDriverId: string,
  lat?: number | null,
  lng?: number | null,
): Promise<FuelRequest[]> {
  if (!useAdmin()) {
    return mockRepo.listNearbyFuelHelp(helperDriverId, lat, lng);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_fuel_requests")
    .select(
      "*, requester:rr_drivers!rr_fuel_requests_requester_driver_id_fkey(id, full_name, phone)",
    )
    .eq("status", "pending")
    .neq("requester_driver_id", helperDriverId)
    .order("created_at", { ascending: false })
    .limit(30);

  let rows: FuelRequest[] = [];
  if (error) {
    const { data: plain } = await admin
      .from("rr_fuel_requests")
      .select("*")
      .eq("status", "pending")
      .neq("requester_driver_id", helperDriverId)
      .order("created_at", { ascending: false })
      .limit(30);
    rows = (plain as FuelRequest[]) ?? [];
  } else {
    rows = (data as FuelRequest[]) ?? [];
  }

  if (lat == null || lng == null) return rows.slice(0, 10);
  const origin = { lat, lng };
  return rows
    .filter((r) => {
      if (r.location_lat == null || r.location_lng == null) return true;
      return (
        distanceKm(origin, {
          lat: r.location_lat,
          lng: r.location_lng,
        }) <= FUEL_RADIUS_KM
      );
    })
    .slice(0, 10);
}

export async function acceptFuelHelp(
  requestId: string,
  helperDriverId: string,
): Promise<FuelRequest> {
  if (!useAdmin()) {
    const row = mockRepo.acceptFuelHelp(requestId, helperDriverId);
    revalidateFuel();
    return row;
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("rr_fuel_requests")
    .update({
      helper_driver_id: helperDriverId,
      status: "assigned",
      assigned_at: now,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Request already taken or cancelled.");
  revalidateFuel();
  return data as FuelRequest;
}

export async function markFuelDelivered(
  requestId: string,
  driverId: string,
): Promise<FuelRequest> {
  if (!useAdmin()) {
    const row = mockRepo.markFuelDelivered(requestId, driverId);
    revalidateFuel();
    return row;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rr_fuel_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!existing) throw new Error("Request not found.");
  const row = existing as FuelRequest;
  if (
    row.requester_driver_id !== driverId &&
    row.helper_driver_id !== driverId
  ) {
    throw new Error("Not your fuel request.");
  }
  if (row.status !== "assigned") {
    throw new Error("Request is not in delivery.");
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("rr_fuel_requests")
    .update({
      status: "delivered",
      delivered_at: now,
      updated_at: now,
    })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateFuel();
  return data as FuelRequest;
}

export async function cancelFuelRequest(
  requestId: string,
  driverId: string,
): Promise<void> {
  if (!useAdmin()) {
    mockRepo.cancelFuelRequest(requestId, driverId);
    revalidateFuel();
    return;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rr_fuel_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!existing) throw new Error("Request not found.");
  const row = existing as FuelRequest;
  if (row.requester_driver_id !== driverId) {
    throw new Error("Only the stranded driver can cancel.");
  }
  if (row.status === "delivered") {
    throw new Error("Already delivered.");
  }

  const { error } = await admin
    .from("rr_fuel_requests")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidateFuel();
}

export async function listOpenFuelRequestsForOps(): Promise<FuelRequest[]> {
  if (!useAdmin()) return mockRepo.listOpenFuelRequests();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_fuel_requests")
    .select("*")
    .in("status", ["pending", "assigned"])
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return (data as FuelRequest[]) ?? [];
}
