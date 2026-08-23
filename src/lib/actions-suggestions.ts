"use server";

import { mockRepo } from "./mock-store";
import { DEFAULT_COUNTRY } from "./countries";
import { distanceKm } from "./geo";
import { placesNear } from "./landmarks";
import { geocodeNearbyPois } from "./mapbox-server";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/server";
import { listSavedLocations } from "./actions-locations";
import {
  categoryFromText,
  formatSuggestionDistance,
  mergeSuggestionLists,
  scoreNearbyPlace,
  type PlaceSuggestion,
  type SuggestionsPayload,
} from "./suggestions";
import type { Job, RecentDestination } from "./types";

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function weekAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function savedToSuggestion(row: {
  id: string;
  name: string;
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  is_home: boolean;
  is_work: boolean;
  is_farm?: boolean;
}): PlaceSuggestion {
  const label: PlaceSuggestion["label"] = row.is_home
    ? "home"
    : row.is_work
      ? "work"
      : row.is_farm
        ? "farm"
        : "other";
  return {
    type: "saved",
    id: row.id,
    label,
    name: row.name,
    address: row.label || row.name,
    lat: row.latitude,
    lng: row.longitude,
  };
}

function recentToSuggestion(row: RecentDestination): PlaceSuggestion {
  return {
    type: "recent",
    id: row.id,
    name: row.name,
    address: row.address || row.name,
    lat: row.lat,
    lng: row.lng,
    ride_count: row.ride_count,
  };
}

async function listRecentForPhone(phone: string): Promise<RecentDestination[]> {
  if (!phone) return [];
  if (!useAdmin()) return mockRepo.listRecentDestinations(phone, 5);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_recent_destinations")
    .select("*")
    .eq("guest_phone", phone)
    .gte("last_ridden_at", weekAgoIso())
    .order("last_ridden_at", { ascending: false })
    .limit(5);
  if (error) return [];
  return (data ?? []) as RecentDestination[];
}

async function recentsFromJobs(phone: string): Promise<PlaceSuggestion[]> {
  try {
    const digits = phone.replace(/\D/g, "");
    const local = digits.startsWith("27")
      ? digits.slice(2)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;
    const variants = [`0${local}`, `27${local}`, `+27${local}`, local, phone];
    const jobs = !useAdmin()
      ? mockRepo.listJobsByCustomerPhone(variants)
      : ((
          await createAdminClient()
            .from("rr_jobs")
            .select(
              "id, dropoff_landmark, dropoff_lat, dropoff_lng, pickup_landmark, service_type",
            )
            .in("customer_phone", variants)
            .order("created_at", { ascending: false })
            .limit(20)
        ).data ?? []);

    const seen = new Set<string>();
    const out: PlaceSuggestion[] = [];
    for (const job of jobs) {
      const name = String(job.dropoff_landmark || "").trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      const st = (job as { service_type?: string }).service_type;
      out.push({
        type: "recent",
        id: `job:${job.id}`,
        name,
        address: job.pickup_landmark
          ? `From ${job.pickup_landmark}`
          : name,
        lat: job.dropoff_lat,
        lng: job.dropoff_lng,
        ride_count: 1,
        service_hint:
          st === "delivery" ||
          st === "farm" ||
          st === "courier" ||
          st === "ride"
            ? st
            : undefined,
      });
      if (out.length >= 5) break;
    }
    return out;
  } catch {
    return [];
  }
}

function attachDistance(
  pin: { lat: number; lng: number },
  items: PlaceSuggestion[],
): PlaceSuggestion[] {
  return items.map((p) => {
    if (p.lat == null || p.lng == null) return p;
    const km = distanceKm(pin, { lat: p.lat, lng: p.lng });
    return {
      ...p,
      distance_km: Math.round(km * 100) / 100,
      distance: formatSuggestionDistance(km),
    };
  });
}

async function loadSavedAndRecent(phone: string): Promise<{
  saved: PlaceSuggestion[];
  recent: PlaceSuggestion[];
}> {
  if (!phone) return { saved: [], recent: [] };
  const [savedRows, recentRows] = await Promise.all([
    listSavedLocations(phone).catch(() => []),
    listRecentForPhone(phone).catch(() => []),
  ]);
  let recent = recentRows.map(recentToSuggestion);
  if (recent.length === 0) {
    recent = await recentsFromJobs(phone);
  }
  return {
    saved: savedRows.map(savedToSuggestion),
    recent,
  };
}

export async function getNearbySuggestions(input: {
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  countryCode?: string | null;
}): Promise<SuggestionsPayload> {
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  const countryCode = (input.countryCode || DEFAULT_COUNTRY).toUpperCase();
  const phone = input.phone?.trim() || "";
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng);
  const pin = { lat, lng };

  const personal = await loadSavedAndRecent(phone);
  if (!hasPin) {
    const merged = mergeSuggestionLists({
      saved: personal.saved,
      recent: personal.recent,
      nearby: [],
    });
    merged.saved.sort((a, b) => {
      const order = { home: 0, work: 1, farm: 2, other: 3 };
      return (order[a.label || "other"] ?? 3) - (order[b.label || "other"] ?? 3);
    });
    return merged;
  }

  const pois = await geocodeNearbyPois({
    lat,
    lng,
    countryCode,
    limit: 10,
  }).catch(() => []);

  const local = placesNear(pin, 3, countryCode, 12);
  type Scored = PlaceSuggestion & { score: number };
  const nearbyRaw: Scored[] = [
    ...pois.map((p) => {
      const km = distanceKm(pin, { lat: p.lat, lng: p.lng });
      const category = categoryFromText(p.name, p.category);
      return {
        type: "nearby" as const,
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        category,
        distance_km: km,
        distance: formatSuggestionDistance(km),
        score: scoreNearbyPlace({
          name: p.name,
          category,
          distanceKm: km,
          countryCode,
        }),
      };
    }),
    ...local.map((p) => {
      const km = distanceKm(pin, { lat: p.lat, lng: p.lng });
      const category = categoryFromText(p.label, p.kind);
      return {
        type: "nearby" as const,
        id: p.id,
        name: p.label,
        address: p.village,
        lat: p.lat,
        lng: p.lng,
        category,
        distance_km: km,
        distance: formatSuggestionDistance(km),
        score: scoreNearbyPlace({
          name: p.label,
          category,
          distanceKm: km,
          countryCode,
        }),
      };
    }),
  ];

  nearbyRaw.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const nearby = nearbyRaw
    .filter((p) => (p.distance_km ?? 0) <= 3)
    .map(({ score: _s, ...rest }) => rest);

  const merged = mergeSuggestionLists({
    saved: attachDistance(pin, personal.saved),
    recent: attachDistance(pin, personal.recent),
    nearby,
  });

  merged.saved.sort((a, b) => {
    const order = { home: 0, work: 1, farm: 2, other: 3 };
    return (order[a.label || "other"] ?? 3) - (order[b.label || "other"] ?? 3);
  });

  return merged;
}

export async function recordRecentDestination(input: {
  phone: string;
  name: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  countryCode?: string | null;
  jobId?: string | null;
}): Promise<void> {
  const phone = input.phone.trim();
  const name = input.name.trim();
  if (!phone || !name) return;

  if (!useAdmin()) {
    mockRepo.upsertRecentDestination({
      guest_phone: phone,
      name,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      country_code: input.countryCode || DEFAULT_COUNTRY,
      job_id: input.jobId,
    });
    return;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rr_recent_destinations")
    .select("id, ride_count, job_id")
    .eq("guest_phone", phone)
    .ilike("name", name)
    .maybeSingle();

  if (existing?.id) {
    if (input.jobId && existing.job_id === input.jobId) return;
    await admin
      .from("rr_recent_destinations")
      .update({
        ride_count: Number(existing.ride_count || 1) + 1,
        last_ridden_at: new Date().toISOString(),
        address: input.address?.trim() || name,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        job_id: input.jobId ?? null,
      })
      .eq("id", existing.id);
    return;
  }

  await admin.from("rr_recent_destinations").insert({
    guest_phone: phone,
    name,
    address: input.address?.trim() || name,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    ride_count: 1,
    last_ridden_at: new Date().toISOString(),
    country_code: input.countryCode || DEFAULT_COUNTRY,
    job_id: input.jobId ?? null,
  });
}

export async function recordRecentFromJob(job: Pick<
  Job,
  | "id"
  | "customer_phone"
  | "dropoff_landmark"
  | "dropoff_lat"
  | "dropoff_lng"
  | "country_code"
  | "service_type"
>): Promise<void> {
  if (job.service_type && job.service_type !== "ride") return;
  try {
    await recordRecentDestination({
      phone: job.customer_phone,
      name: job.dropoff_landmark,
      address: job.dropoff_landmark,
      lat: job.dropoff_lat,
      lng: job.dropoff_lng,
      countryCode: job.country_code,
      jobId: job.id,
    });
  } catch {
    /* best-effort — booking must not fail */
  }
}
