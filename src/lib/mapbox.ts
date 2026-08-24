/** Public Mapbox token from NEXT_PUBLIC_MAPBOX_TOKEN. Restrict URLs in the Mapbox console. */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";

export const MAPBOX_STYLE_RIDER = "mapbox://styles/mapbox/light-v11";
export const MAPBOX_STYLE_DRIVER = "mapbox://styles/mapbox/dark-v11";
/** @deprecated Prefer MAPBOX_STYLE_RIDER / MAPBOX_STYLE_DRIVER */
export const MAPBOX_STYLE = MAPBOX_STYLE_DRIVER;

export type MapStyleVariant = "rider" | "driver";

export type MapPin = { lat: number; lng: number };
