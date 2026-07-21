"use server";

import { revalidatePath } from "next/cache";
import { mockRepo } from "./mock-store";
import { isValidMobileForCountry } from "./phone";
import { DEFAULT_COUNTRY, getCountry } from "./countries";
import { sendPushToToken } from "./firebase/admin";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/server";
import type {
  CreateGroupTripInput,
  Driver,
  GroupTrip,
  JoinGroupTripInput,
} from "./types";

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function revalidateGroup() {
  revalidatePath("/");
  revalidatePath("/group");
  revalidatePath("/services");
  revalidatePath("/driver/home");
  revalidatePath("/driver/group");
}

const TRIP_SELECT =
  "*, drivers:rr_drivers!driver_id(*), participants:rr_group_trip_participants(*)";

export async function listOpenGroupTrips(): Promise<GroupTrip[]> {
  if (!useAdmin()) return mockRepo.listOpenGroupTrips();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_group_trips")
    .select(TRIP_SELECT)
    .in("status", ["open", "full"])
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return (data ?? []) as GroupTrip[];
}

export async function getGroupTrip(id: string): Promise<GroupTrip | null> {
  if (!useAdmin()) return mockRepo.getGroupTrip(id);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_group_trips")
    .select(TRIP_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as GroupTrip) ?? null;
}

export async function listDriverGroupTrips(
  driverId: string,
): Promise<GroupTrip[]> {
  if (!useAdmin()) return mockRepo.listDriverGroupTrips(driverId);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_group_trips")
    .select(TRIP_SELECT)
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data ?? []) as GroupTrip[];
}

export async function createGroupTrip(
  input: CreateGroupTripInput,
): Promise<GroupTrip> {
  if (!input.route_pickup?.trim() || !input.route_dropoff?.trim()) {
    throw new Error("Pickup and dropoff are required.");
  }
  const capacity = Math.max(1, Math.min(40, Math.floor(Number(input.capacity))));
  const price = Math.max(0, Number(input.price_per_person) || 0);
  if (price <= 0) throw new Error("Price per person must be greater than 0.");

  if (!useAdmin()) {
    const trip = mockRepo.createGroupTrip({
      ...input,
      capacity,
      price_per_person: price,
    });
    revalidateGroup();
    return trip;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_group_trips")
    .insert({
      driver_id: input.driver_id,
      kind: input.kind,
      title: input.title?.trim() || null,
      route_pickup: input.route_pickup.trim(),
      route_dropoff: input.route_dropoff.trim(),
      route_stops: (input.route_stops ?? [])
        .map((s) => s.trim())
        .filter(Boolean),
      capacity,
      seats_taken: 0,
      status: "open",
      price_per_person: price,
      total_price: price * capacity,
      country_code: input.country_code || DEFAULT_COUNTRY,
      departs_at: input.departs_at || null,
    })
    .select(TRIP_SELECT)
    .single();
  if (error) throw new Error(error.message);
  revalidateGroup();
  return data as GroupTrip;
}

export async function joinGroupTrip(
  input: JoinGroupTripInput,
): Promise<GroupTrip> {
  const name = input.guest_name?.trim();
  const phone = input.guest_phone?.trim();
  if (!name || !phone) throw new Error("Name and phone are required.");
  if (!isValidMobileForCountry(phone, DEFAULT_COUNTRY)) {
    const c = getCountry(DEFAULT_COUNTRY);
    throw new Error(`Enter a valid ${c.name} mobile.`);
  }
  const seats = Math.max(1, Math.min(10, Math.floor(input.seats ?? 1)));

  if (!useAdmin()) {
    const trip = mockRepo.joinGroupTrip({ ...input, seats });
    revalidateGroup();
    return trip;
  }

  const admin = createAdminClient();
  const { data: tripRow, error: fetchErr } = await admin
    .from("rr_group_trips")
    .select("*")
    .eq("id", input.group_trip_id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  const trip = tripRow as GroupTrip;
  if (trip.status !== "open") {
    throw new Error("This group is full or closed.");
  }
  if (trip.seats_taken + seats > trip.capacity) {
    throw new Error("Not enough spots left.");
  }

  const amountDue = Number(trip.price_per_person) * seats;
  const { error: partErr } = await admin
    .from("rr_group_trip_participants")
    .insert({
      group_trip_id: trip.id,
      guest_name: name,
      guest_phone: phone,
      seats,
      amount_due: amountDue,
      status: "confirmed",
    });
  if (partErr) throw new Error(partErr.message);

  const nextTaken = trip.seats_taken + seats;
  const nextStatus = nextTaken >= trip.capacity ? "full" : "open";
  const { error: updErr } = await admin
    .from("rr_group_trips")
    .update({ seats_taken: nextTaken, status: nextStatus })
    .eq("id", trip.id);
  if (updErr) throw new Error(updErr.message);

  if (nextStatus === "full") {
    await notifyDriverGroupFull(trip.driver_id, trip);
  }

  revalidateGroup();
  revalidatePath(`/group/${trip.id}`);
  const refreshed = await getGroupTrip(trip.id);
  if (!refreshed) throw new Error("Group trip not found after join");
  return refreshed;
}

async function notifyDriverGroupFull(driverId: string, trip: GroupTrip) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("rr_drivers")
      .select("fcm_token, full_name")
      .eq("id", driverId)
      .maybeSingle();
    const driver = data as Pick<Driver, "fcm_token" | "full_name"> | null;
    await sendPushToToken(driver?.fcm_token, {
      title: "Group trip is full",
      body: `${trip.title || "Your group ride"} is full — ${trip.route_pickup} → ${trip.route_dropoff}`,
      data: {
        url: `/driver/group`,
        group_trip_id: trip.id,
      },
    });
  } catch (err) {
    console.error("[group] full notify failed", err);
  }
}
