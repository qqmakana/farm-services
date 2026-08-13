export type AddressSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  relevance: number;
  accuracy: string | null;
  /** True when Mapbox is guessing — UI must confirm, not auto-pin. */
  needsConfirmation: boolean;
  source: "mapbox" | "landmark";
  inServiceArea: boolean;
};

export type DrivingRoute = {
  distanceKm: number;
  durationSeconds: number;
  geometry: { type: "LineString"; coordinates: [number, number][] };
};
