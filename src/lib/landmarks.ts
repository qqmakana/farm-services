/** Common village landmark suggestions for pickup / dropoff search. */
export const LANDMARK_SUGGESTIONS = [
  "Next to the clinic",
  "Big blue gate",
  "Opposite the school",
  "Main taxi rank",
  "Village entrance",
  "Red house near the shop",
  "Under the big tree",
  "Church gate",
  "Spaza shop corner",
  "Community hall",
  "Soccer ground",
  "Water tank",
  "Police station",
  "Primary school",
  "Market square",
] as const;

export function filterLandmarkSuggestions(query: string, limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...LANDMARK_SUGGESTIONS].slice(0, limit);
  return LANDMARK_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(
    0,
    limit,
  );
}

/** Default map centre — Westdene / Joburg area (Sandton Streets). */
export const DEFAULT_MAP_CENTER = {
  lat: -26.1908,
  lng: 27.9892,
} as const;
