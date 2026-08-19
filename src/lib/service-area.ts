import { distanceKm } from "./geo";
import { searchPlaces, type Place } from "./landmarks";

/**
 * Hard geofence for ZA pilot towns. Pickup and dropoff must both sit in the
 * same zone — timezone notices are not a substitute.
 */
export type ServiceZone = {
  id: string;
  name: string;
  countryCode: string;
  lat: number;
  lng: number;
  radiusKm: number;
};

export const SERVICE_ZONES: readonly ServiceZone[] = [
  {
    id: "alice",
    name: "Alice / Fort Hare",
    countryCode: "ZA",
    lat: -32.787,
    lng: 26.834,
    radiusKm: 40,
  },
  {
    id: "mthatha",
    name: "Mthatha / Engcobo",
    countryCode: "ZA",
    lat: -31.588,
    lng: 28.784,
    radiusKm: 45,
  },
];

export function zonesForCountry(countryCode?: string | null): ServiceZone[] {
  const code = (countryCode || "ZA").toUpperCase();
  return SERVICE_ZONES.filter((z) => z.countryCode === code);
}

/**
 * Town-lock is off. Search and book anywhere in the selected country
 * (Uber-style). SERVICE_ZONES stay as search-proximity hints only.
 */
export function hasServiceGeofence(_countryCode?: string | null): boolean {
  return false;
}

export function zoneContaining(
  point: { lat: number; lng: number },
  countryCode?: string | null,
): ServiceZone | null {
  const zones = zonesForCountry(countryCode);
  let best: { zone: ServiceZone; km: number } | null = null;
  for (const zone of zones) {
    const km = distanceKm(point, { lat: zone.lat, lng: zone.lng });
    if (km <= zone.radiusKm && (!best || km < best.km)) {
      best = { zone, km };
    }
  }
  return best?.zone ?? null;
}

export function isInServiceArea(
  point: { lat: number; lng: number },
  countryCode?: string | null,
): boolean {
  if (!hasServiceGeofence(countryCode)) return true;
  return zoneContaining(point, countryCode) != null;
}

export function serviceAreaNames(countryCode?: string | null): string {
  const zones = zonesForCountry(countryCode);
  if (!zones.length) return "our service area";
  return zones.map((z) => z.name).join(" and ");
}

export function serviceAreaBbox(
  countryCode?: string | null,
): [number, number, number, number] | null {
  const zones = zonesForCountry(countryCode);
  if (!zones.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const z of zones) {
    const dLat = z.radiusKm / 111;
    const dLng = z.radiusKm / (111 * Math.cos((z.lat * Math.PI) / 180));
    minLng = Math.min(minLng, z.lng - dLng);
    minLat = Math.min(minLat, z.lat - dLat);
    maxLng = Math.max(maxLng, z.lng + dLng);
    maxLat = Math.max(maxLat, z.lat + dLat);
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function defaultProximity(
  countryCode?: string | null,
): { lat: number; lng: number } {
  const zones = zonesForCountry(countryCode);
  if (zones[0]) return { lat: zones[0].lat, lng: zones[0].lng };
  return { lat: -32.787, lng: 26.834 };
}

export type ServiceAreaCheck =
  | { ok: true; zone: ServiceZone | null }
  | { ok: false; message: string };

/** Pickup and dropoff must both be pinned inside the same serviced zone. */
export function checkBookingServiceArea(
  pickup: { lat: number; lng: number } | null | undefined,
  dropoff: { lat: number; lng: number } | null | undefined,
  countryCode?: string | null,
): ServiceAreaCheck {
  if (!hasServiceGeofence(countryCode)) {
    return { ok: true, zone: null };
  }
  const area = serviceAreaNames(countryCode);
  if (!pickup || !dropoff) {
    return {
      ok: false,
      message: `Choose a pinned pickup and dropoff in ${area}.`,
    };
  }
  const pickZone = zoneContaining(pickup, countryCode);
  const dropZone = zoneContaining(dropoff, countryCode);
  if (!pickZone && !dropZone) {
    return {
      ok: false,
      message: `That trip is outside our service area. We currently operate in ${area}.`,
    };
  }
  if (!pickZone) {
    return {
      ok: false,
      message: `Pickup is outside our service area (${area}).`,
    };
  }
  if (!dropZone) {
    return {
      ok: false,
      message: `Dropoff is outside our service area (${area}).`,
    };
  }
  if (pickZone.id !== dropZone.id) {
    return {
      ok: false,
      message: `Pickup and dropoff must both be in ${pickZone.name}. We don't offer trips between different towns yet.`,
    };
  }
  return { ok: true, zone: pickZone };
}

export function assertBookingInServiceArea(
  pickup: { lat: number; lng: number } | null | undefined,
  dropoff: { lat: number; lng: number } | null | undefined,
  countryCode?: string | null,
): void {
  const check = checkBookingServiceArea(pickup, dropoff, countryCode);
  if (!check.ok) throw new Error(check.message);
}

/** Landmark fallback — only places already inside a live service zone. */
export function searchServiceAreaLandmarks(
  query: string,
  limit = 6,
  countryCode = "ZA",
): Place[] {
  if (!hasServiceGeofence(countryCode)) {
    return searchPlaces(query, limit, countryCode);
  }
  return searchPlaces(query, 250, countryCode)
    .filter((p) => isInServiceArea({ lat: p.lat, lng: p.lng }, countryCode))
    .slice(0, limit);
}
