"use server";

import { revalidatePath } from "next/cache";
import { mockRepo } from "./mock-store";
import { DEFAULT_COUNTRY, type CountryCode } from "./countries";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/server";
import type {
  CommunityLocation,
  CreateLocationInput,
  SavedLocation,
  SavePersonalLocationInput,
} from "./types";

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function revalidateLocations() {
  revalidatePath("/");
  revalidatePath("/ride");
  revalidatePath("/delivery");
  revalidatePath("/farm");
  revalidatePath("/account/places");
  revalidatePath("/shop");
}

function normalizeName(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function asCountry(code?: string | null): CountryCode {
  return (code as CountryCode) || DEFAULT_COUNTRY;
}

/** Search community locations (+ popular first). */
export async function searchCommunityLocations(
  query: string,
  countryCode = DEFAULT_COUNTRY,
  limit = 8,
): Promise<CommunityLocation[]> {
  if (!useAdmin()) {
    return mockRepo.searchCommunityLocations(query, countryCode, limit);
  }

  const admin = createAdminClient();
  const q = query.trim();
  let req = admin
    .from("rr_locations")
    .select("*")
    .eq("country_code", countryCode)
    .order("usage_count", { ascending: false })
    .limit(limit);

  if (q) {
    req = admin
      .from("rr_locations")
      .select("*")
      .eq("country_code", countryCode)
      .or(`name.ilike.%${q}%,village.ilike.%${q}%,description.ilike.%${q}%`)
      .order("usage_count", { ascending: false })
      .limit(limit);
  }

  const { data, error } = await req;
  if (error) throw new Error(error.message);
  return (data ?? []) as CommunityLocation[];
}

/** Find near-duplicate by name + village (dedupe hint). */
export async function findSimilarLocations(
  name: string,
  village: string,
  countryCode = DEFAULT_COUNTRY,
): Promise<CommunityLocation[]> {
  if (!useAdmin()) {
    return mockRepo.findSimilarLocations(name, village, countryCode);
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_locations")
    .select("*")
    .eq("country_code", countryCode)
    .ilike("village", `%${village.trim()}%`)
    .ilike("name", `%${name.trim()}%`)
    .limit(5);
  if (error) throw new Error(error.message);
  return (data ?? []) as CommunityLocation[];
}

export async function createCommunityLocation(
  input: CreateLocationInput,
): Promise<CommunityLocation> {
  const name = input.name.trim();
  const village = input.village.trim();
  const description = input.description?.trim() || "";
  if (!name || !village) throw new Error("Name and village/town are required.");

  const hasPin =
    input.latitude != null &&
    input.longitude != null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude);

  if (!hasPin && description.length < 3) {
    throw new Error(
      "No GPS? Add a clear description (e.g. “Next to the blue water tank”). Map pin is optional.",
    );
  }

  const similar = await findSimilarLocations(
    name,
    village,
    asCountry(input.country_code),
  );
  const exact = similar.find(
    (s) =>
      normalizeName(s.name) === normalizeName(name) &&
      normalizeName(s.village) === normalizeName(village),
  );
  if (exact) {
    throw new Error(
      `Similar place already exists: “${exact.name}” in ${exact.village}. Use that instead.`,
    );
  }

  const lat = hasPin ? input.latitude! : null;
  const lng = hasPin ? input.longitude! : null;

  if (!useAdmin()) {
    const loc = mockRepo.createCommunityLocation({
      ...input,
      description,
      latitude: lat,
      longitude: lng,
    });
    revalidateLocations();
    return loc;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_locations")
    .insert({
      name,
      category: input.category,
      description: description || null,
      village,
      latitude: lat,
      longitude: lng,
      country_code: input.country_code || DEFAULT_COUNTRY,
      created_by_phone: input.created_by_phone?.trim() || null,
      created_by_name: input.created_by_name?.trim() || null,
      shop_id: input.shop_id ?? null,
      is_verified: Boolean(input.shop_id),
      usage_count: 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateLocations();
  return data as CommunityLocation;
}

export async function bumpLocationUsage(locationId: string) {
  if (!useAdmin()) {
    mockRepo.bumpLocationUsage(locationId);
    return;
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_locations")
    .select("usage_count")
    .eq("id", locationId)
    .maybeSingle();
  const next = (Number(data?.usage_count) || 0) + 1;
  await admin
    .from("rr_locations")
    .update({ usage_count: next })
    .eq("id", locationId);
}

export async function listSavedLocations(
  guestPhone: string,
): Promise<SavedLocation[]> {
  const phone = guestPhone.trim();
  if (!phone) return [];
  if (!useAdmin()) return mockRepo.listSavedLocations(phone);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_saved_locations")
    .select("*")
    .eq("guest_phone", phone)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SavedLocation[];
}

export async function savePersonalLocation(
  input: SavePersonalLocationInput,
): Promise<SavedLocation> {
  const phone = input.guest_phone.trim();
  const name = input.name.trim();
  const label = (input.label?.trim() || name).trim();
  if (!phone || !name) throw new Error("Phone and place name are required.");

  const hasPin =
    input.latitude != null &&
    input.longitude != null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude);

  if (!hasPin && label.length < 2) {
    throw new Error(
      "Add a landmark description (e.g. “Clinic gate, Qunu”). Map pin is optional.",
    );
  }

  const lat = hasPin ? input.latitude! : null;
  const lng = hasPin ? input.longitude! : null;

  if (!useAdmin()) {
    const row = mockRepo.savePersonalLocation({
      ...input,
      label,
      latitude: lat,
      longitude: lng,
    });
    revalidateLocations();
    return row;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_saved_locations")
    .insert({
      guest_phone: phone,
      name,
      label,
      latitude: lat,
      longitude: lng,
      location_id: input.location_id ?? null,
      is_home: Boolean(input.is_home),
      is_work: Boolean(input.is_work),
      country_code: input.country_code || DEFAULT_COUNTRY,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateLocations();
  return data as SavedLocation;
}

export async function deleteSavedLocation(id: string, guestPhone: string) {
  if (!useAdmin()) {
    mockRepo.deleteSavedLocation(id, guestPhone);
    revalidateLocations();
    return;
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("rr_saved_locations")
    .delete()
    .eq("id", id)
    .eq("guest_phone", guestPhone.trim());
  if (error) throw new Error(error.message);
  revalidateLocations();
}

/** Publish shop/farm as a searchable community location after signup. */
export async function publishShopAsLocation(input: {
  shop_id: string;
  name: string;
  category: string;
  landmark: string;
  village?: string;
  latitude: number | null;
  longitude: number | null;
  phone?: string;
  country_code?: string;
}): Promise<CommunityLocation | null> {
  if (input.latitude == null || input.longitude == null) return null;
  const cat =
    input.category === "farm"
      ? "farm"
      : ("shop" as const);
  return createCommunityLocation({
    name: input.name,
    category: cat,
    description: input.landmark,
    village: input.village?.trim() || input.landmark.split("·")[0]?.trim() || input.landmark,
    latitude: input.latitude,
    longitude: input.longitude,
    country_code: input.country_code || DEFAULT_COUNTRY,
    created_by_phone: input.phone,
    created_by_name: input.name,
    shop_id: input.shop_id,
  });
}
