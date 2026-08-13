/** Public Mapbox token from NEXT_PUBLIC_MAPBOX_TOKEN. Restrict URLs in the Mapbox console. */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

export type MapPin = { lat: number; lng: number };
