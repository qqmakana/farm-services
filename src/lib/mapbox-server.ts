import { distanceKm } from "./geo";
import {
  defaultProximity,
  zoneContaining,
} from "./service-area";
import type { AddressSuggestion, DrivingRoute } from "./mapbox-types";

export type { AddressSuggestion, DrivingRoute } from "./mapbox-types";

/**
 * Server-only Mapbox token. Prefer MAPBOX_SECRET_TOKEN (sk.) so Directions /
 * Geocoding never need a full-access key in the browser. Falls back to the
 * public pk token already used for the map — still only read on the server.
 */
export function mapboxServerToken(): string {
  return (
    process.env.MAPBOX_SECRET_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
    ""
  );
}

export const GEOCODE_MIN_RELEVANCE = 0.3;
export const GEOCODE_AUTO_ACCEPT_RELEVANCE = 0.72;

type MapboxFeature = {
  id?: string;
  place_name?: string;
  text?: string;
  relevance?: number;
  center?: [number, number];
  properties?: {
    accuracy?: string;
    category?: string;
    maki?: string;
  };
};

export function classifyMapboxFeature(
  feature: MapboxFeature,
  countryCode?: string | null,
): AddressSuggestion | null {
  const center = feature.center;
  if (!center || center.length < 2) return null;
  const relevance = Number(feature.relevance ?? 0);
  if (relevance < GEOCODE_MIN_RELEVANCE) return null;
  const lng = center[0];
  const lat = center[1];
  const accuracy = feature.properties?.accuracy ?? null;
  const needsConfirmation =
    relevance < GEOCODE_AUTO_ACCEPT_RELEVANCE || accuracy === "approximate";
  return {
    id: String(feature.id || `${lat},${lng}`),
    label: String(feature.place_name || feature.text || "").trim(),
    lat,
    lng,
    relevance,
    accuracy,
    needsConfirmation,
    source: "mapbox",
    inServiceArea: zoneContaining({ lat, lng }, countryCode) != null,
  };
}

const routeCache = new Map<
  string,
  { at: number; value: DrivingRoute }
>();
const ROUTE_CACHE_MS = 60_000;

function routeCacheKey(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const r = (n: number) => n.toFixed(5);
  return `${r(from.lat)},${r(from.lng)}:${r(to.lat)},${r(to.lng)}`;
}

export function isSameStop(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  return distanceKm(a, b) < 0.05;
}

function fallbackRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): DrivingRoute {
  const km = Math.round(distanceKm(from, to) * 10) / 10;
  return {
    distanceKm: km,
    durationSeconds: Math.max(60, Math.round((km / 30) * 3600)),
    geometry: {
      type: "LineString",
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    },
  };
}

export async function getDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingRoute> {
  if (isSameStop(from, to)) {
    return {
      distanceKm: 0,
      durationSeconds: 0,
      geometry: {
        type: "LineString",
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
    };
  }

  const key = routeCacheKey(from, to);
  const hit = routeCache.get(key);
  if (hit && Date.now() - hit.at < ROUTE_CACHE_MS) return hit.value;

  const token = mapboxServerToken();
  if (!token) return fallbackRoute(from, to);

  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${path}` +
    `?alternatives=false&geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallbackRoute(from, to);
    const body = (await res.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { type?: string; coordinates?: [number, number][] };
      }>;
    };
    const route = body.routes?.[0];
    if (!route || body.code !== "Ok") return fallbackRoute(from, to);
    const meters = Number(route.distance ?? 0);
    const value: DrivingRoute = {
      distanceKm: Math.round((meters / 1000) * 10) / 10,
      durationSeconds: Math.round(Number(route.duration ?? 0)),
      geometry: {
        type: "LineString",
        coordinates: route.geometry?.coordinates ?? [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
    };
    routeCache.set(key, { at: Date.now(), value });
    if (routeCache.size > 80) {
      const first = routeCache.keys().next().value;
      if (first) routeCache.delete(first);
    }
    return value;
  } catch {
    return fallbackRoute(from, to);
  }
}

export async function geocodeAddressQuery(
  query: string,
  opts?: {
    countryCode?: string | null;
    proximity?: { lat: number; lng: number } | null;
    limit?: number;
  },
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const token = mapboxServerToken();
  if (!token) return [];

  const country = (opts?.countryCode || "ZA").toLowerCase();
  const proximity = opts?.proximity ?? defaultProximity(opts?.countryCode);
  const params = new URLSearchParams({
    access_token: token,
    autocomplete: "true",
    country,
    limit: String(opts?.limit ?? 8),
    types: "address,poi,place,locality,neighborhood,district,region",
    proximity: `${proximity.lng},${proximity.lat}`,
  });

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?` +
    params.toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Address search failed. Try again in a moment.");
  }
  const body = (await res.json()) as { features?: MapboxFeature[] };
  const out: AddressSuggestion[] = [];
  for (const feature of body.features ?? []) {
    const mapped = classifyMapboxFeature(feature, opts?.countryCode);
    if (!mapped?.label) continue;
    out.push(mapped);
  }
  return out;
}

export type NearbyPoi = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
};

const nearbyCache = new Map<string, { at: number; value: NearbyPoi[] }>();
const NEARBY_CACHE_MS = 5 * 60 * 1000;

/** Reverse-geocode POIs around a pin. Cached 5 minutes per ~100m cell. */
export async function geocodeNearbyPois(opts: {
  lat: number;
  lng: number;
  countryCode?: string | null;
  limit?: number;
}): Promise<NearbyPoi[]> {
  const token = mapboxServerToken();
  if (!token) return [];
  const lat = Number(opts.lat);
  const lng = Number(opts.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

  const key = `${(opts.countryCode || "ZA").toUpperCase()}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  const hit = nearbyCache.get(key);
  if (hit && Date.now() - hit.at < NEARBY_CACHE_MS) return hit.value;

  const params = new URLSearchParams({
    access_token: token,
    types: "poi",
    limit: String(opts.limit ?? 10),
    country: (opts.countryCode || "ZA").toLowerCase(),
  });
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
    params.toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const body = (await res.json()) as { features?: MapboxFeature[] };
  const out: NearbyPoi[] = [];
  for (const feature of body.features ?? []) {
    const center = feature.center;
    if (!center || center.length < 2) continue;
    const name = String(feature.text || "").trim();
    if (!name) continue;
    out.push({
      id: String(feature.id || `${center[1]},${center[0]}`),
      name,
      address: String(feature.place_name || name).trim(),
      lat: center[1],
      lng: center[0],
      category: String(
        feature.properties?.category || feature.properties?.maki || "",
      ),
    });
  }
  nearbyCache.set(key, { at: Date.now(), value: out });
  return out;
}

