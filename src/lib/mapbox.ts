/** Public Mapbox token from NEXT_PUBLIC_MAPBOX_TOKEN. Restrict URLs in the Mapbox console. */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

export type MapPin = { lat: number; lng: number };

/** Quadratic arc between two points — Uber-style trip preview, not a straight line. */
export function curvedRoute(
  from: MapPin,
  to: MapPin,
  steps = 56,
): { type: "LineString"; coordinates: [number, number][] } {
  const lng1 = from.lng;
  const lat1 = from.lat;
  const lng2 = to.lng;
  const lat2 = to.lat;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const cx = (lng1 + lng2) / 2 - dy * 0.18;
  const cy = (lat1 + lat2) / 2 + dx * 0.18;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    coords.push([
      u * u * lng1 + 2 * u * t * cx + t * t * lng2,
      u * u * lat1 + 2 * u * t * cy + t * t * lat2,
    ]);
  }
  return { type: "LineString", coordinates: coords };
}
