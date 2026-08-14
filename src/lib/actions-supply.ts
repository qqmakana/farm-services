"use server";

import { distanceKm, jitterLatLng } from "./geo";
import { mockRepo } from "./mock-store";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/server";

const SUPPLY_RADIUS_KM = 18;
const SUPPLY_LIMIT = 8;

export type SupplyMapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function toPins(
  rows: { id: string; last_lat: number | null; last_lng: number | null }[],
  origin: { lat: number; lng: number },
): SupplyMapPin[] {
  return rows
    .filter(
      (d): d is { id: string; last_lat: number; last_lng: number } =>
        d.last_lat != null && d.last_lng != null,
    )
    .map((d) => ({
      d,
      km: distanceKm(origin, { lat: d.last_lat, lng: d.last_lng }),
    }))
    .filter((row) => row.km <= SUPPLY_RADIUS_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, SUPPLY_LIMIT)
    .map((row, i) => {
      const jittered = jitterLatLng(row.d.id, row.d.last_lat, row.d.last_lng);
      return {
        id: `car-${i}`,
        lat: jittered.lat,
        lng: jittered.lng,
        label: "Nearby driver",
      };
    });
}

/** Anonymous nearby online-driver pins for the choose-a-ride map. */
export async function listNearbySupplyPins(
  lat: number,
  lng: number,
): Promise<SupplyMapPin[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
  const origin = { lat, lng };

  if (!useAdmin()) {
    return mockRepo.listNearbySupplyPins(lat, lng);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .select("id, last_lat, last_lng")
    .eq("is_online", true)
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .not("last_lat", "is", null)
    .limit(40);

  if (error) {
    console.error("[supply] nearby pins", error.message);
    return [];
  }

  return toPins(
    (data ?? []) as {
      id: string;
      last_lat: number | null;
      last_lng: number | null;
    }[],
    origin,
  );
}
