/**
 * South Africa–wide place search — towns, cities & landmarks with coordinates.
 * No Google/Mapbox key required. Expand VILLAGE_SEEDS anytime.
 */

export type Place = {
  id: string;
  /** Display: "Engcobo · Main taxi rank" */
  label: string;
  village: string;
  kind: "village" | "landmark";
  lat: number;
  lng: number;
  province?: string;
};

/** Default map centre — Johannesburg (national hub). */
export const DEFAULT_MAP_CENTER = {
  lat: -26.2041,
  lng: 28.0473,
} as const;

/** Common micro-landmarks (paired with every place below). */
export const LANDMARK_HINTS = [
  "Main taxi rank",
  "Clinic",
  "Opposite the school",
  "Village / town entrance",
  "Church gate",
  "Spaza / shop corner",
  "Community hall",
  "Soccer ground",
  "Police station",
  "Market / mall",
  "Big blue gate",
  "Under the big tree",
  "Water tank",
  "Primary school",
  "Hospital",
  "Bus rank",
] as const;

type PlaceSeed = {
  village: string;
  lat: number;
  lng: number;
  province: string;
  /** Extra landmark labels unique to this place */
  extras?: string[];
};

/**
 * Serviced places across all 9 provinces.
 * Includes metros, secondary towns, and rural hubs.
 */
const PLACE_SEEDS: PlaceSeed[] = [
  // ── Gauteng ──
  { village: "Johannesburg", lat: -26.2041, lng: 28.0473, province: "GP", extras: ["Park Station", "Sandton", "Soweto"] },
  { village: "Sandton", lat: -26.1076, lng: 28.0567, province: "GP" },
  { village: "Soweto", lat: -26.2678, lng: 27.8585, province: "GP", extras: ["Vilakazi Street", "Baragwanath"] },
  { village: "Pretoria", lat: -25.7479, lng: 28.2293, province: "GP", extras: ["Church Square", "Hatfield"] },
  { village: "Tshwane", lat: -25.7479, lng: 28.2293, province: "GP" },
  { village: "Midrand", lat: -25.9992, lng: 28.1263, province: "GP" },
  { village: "Centurion", lat: -25.8603, lng: 28.1894, province: "GP" },
  { village: "Benoni", lat: -26.1885, lng: 28.3208, province: "GP" },
  { village: "Boksburg", lat: -26.212, lng: 28.259, province: "GP" },
  { village: "Germiston", lat: -26.225, lng: 28.17, province: "GP" },
  { village: "Krugersdorp", lat: -26.1, lng: 27.767, province: "GP" },
  { village: "Roodepoort", lat: -26.1625, lng: 27.8725, province: "GP" },
  { village: "Westdene", lat: -26.1908, lng: 27.9892, province: "GP" },
  { village: "Alexandra", lat: -26.103, lng: 28.097, province: "GP" },
  { village: "Tembisa", lat: -25.996, lng: 28.227, province: "GP" },
  { village: "Vereeniging", lat: -26.6731, lng: 27.9261, province: "GP" },
  { village: "Vanderbijlpark", lat: -26.7118, lng: 27.837, province: "GP" },

  // ── Western Cape ──
  { village: "Cape Town", lat: -33.9249, lng: 18.4241, province: "WC", extras: ["Cape Town Station", "Khayelitsha", "Mitchells Plain"] },
  { village: "Stellenbosch", lat: -33.9321, lng: 18.8602, province: "WC" },
  { village: "Paarl", lat: -33.7342, lng: 18.9621, province: "WC" },
  { village: "Worcester", lat: -33.6465, lng: 19.4485, province: "WC" },
  { village: "George", lat: -33.963, lng: 22.4617, province: "WC" },
  { village: "Knysna", lat: -34.0359, lng: 23.0465, province: "WC" },
  { village: "Mossel Bay", lat: -34.183, lng: 22.146, province: "WC" },
  { village: "Beaufort West", lat: -32.3567, lng: 22.583, province: "WC" },
  { village: "Khayelitsha", lat: -34.037, lng: 18.678, province: "WC" },
  { village: "Mitchells Plain", lat: -34.05, lng: 18.618, province: "WC" },
  { village: "Bellville", lat: -33.9, lng: 18.63, province: "WC" },
  { village: "Somerset West", lat: -34.083, lng: 18.85, province: "WC" },

  // ── Eastern Cape ──
  { village: "Gqeberha", lat: -33.9608, lng: 25.6022, province: "EC", extras: ["Port Elizabeth", "NJ"] },
  { village: "Port Elizabeth", lat: -33.9608, lng: 25.6022, province: "EC" },
  { village: "East London", lat: -33.0153, lng: 27.9116, province: "EC", extras: ["Mdantsane"] },
  { village: "Mthatha", lat: -31.5887, lng: 28.7844, province: "EC", extras: ["Boxer Superstore", "N2 entrance"] },
  { village: "Engcobo", lat: -31.588, lng: 28.784, province: "EC", extras: ["Engcobo hospital", "Town hall"] },
  { village: "Ngcobo", lat: -31.588, lng: 28.784, province: "EC" },
  { village: "Cofimvaba", lat: -32.005, lng: 27.58, province: "EC" },
  { village: "Dutywa", lat: -32.1, lng: 28.3, province: "EC" },
  { village: "Idutywa", lat: -32.1, lng: 28.3, province: "EC" },
  { village: "Butterworth", lat: -32.33, lng: 28.15, province: "EC" },
  { village: "Qumbu", lat: -31.16, lng: 28.87, province: "EC" },
  { village: "Tsolo", lat: -31.31, lng: 28.75, province: "EC" },
  { village: "Libode", lat: -31.54, lng: 29.02, province: "EC" },
  { village: "Cala", lat: -31.52, lng: 27.7, province: "EC" },
  { village: "Elliot", lat: -31.33, lng: 27.85, province: "EC" },
  { village: "Ngqamakhwe", lat: -32.2, lng: 27.95, province: "EC" },
  { village: "Tsomo", lat: -32.0, lng: 27.82, province: "EC" },
  { village: "King William's Town", lat: -32.883, lng: 27.4, province: "EC" },
  { village: "Qonce", lat: -32.883, lng: 27.4, province: "EC" },
  { village: "Makhanda", lat: -33.31, lng: 26.5256, province: "EC" },
  { village: "Grahamstown", lat: -33.31, lng: 26.5256, province: "EC" },
  { village: "Uitenhage", lat: -33.7576, lng: 25.3971, province: "EC" },
  { village: "Kariega", lat: -33.7576, lng: 25.3971, province: "EC" },
  { village: "Queenstown", lat: -31.8976, lng: 26.8753, province: "EC" },
  { village: "Komani", lat: -31.8976, lng: 26.8753, province: "EC" },
  { village: "Alice", lat: -32.787, lng: 26.834, province: "EC" },
  { village: "Peddie", lat: -33.2, lng: 27.12, province: "EC" },
  { village: "Mdantsane", lat: -32.95, lng: 27.75, province: "EC" },

  // ── KwaZulu-Natal ──
  { village: "Durban", lat: -29.8587, lng: 31.0218, province: "KZN", extras: ["Durban Station", "Umhlanga", "Umlazi"] },
  { village: "Pietermaritzburg", lat: -29.6006, lng: 30.3794, province: "KZN" },
  { village: "Richards Bay", lat: -28.7807, lng: 32.0383, province: "KZN" },
  { village: "Newcastle", lat: -27.757, lng: 29.931, province: "KZN" },
  { village: "Ladysmith", lat: -28.5597, lng: 29.7805, province: "KZN" },
  { village: "Port Shepstone", lat: -30.741, lng: 30.455, province: "KZN" },
  { village: "Empangeni", lat: -28.747, lng: 31.9, province: "KZN" },
  { village: "Ulundi", lat: -28.335, lng: 31.416, province: "KZN" },
  { village: "Vryheid", lat: -27.769, lng: 30.791, province: "KZN" },
  { village: "Umlazi", lat: -29.97, lng: 30.88, province: "KZN" },
  { village: "Pinetown", lat: -29.82, lng: 30.87, province: "KZN" },
  { village: "Umhlanga", lat: -29.728, lng: 31.085, province: "KZN" },
  { village: "Hilton", lat: -29.55, lng: 30.3, province: "KZN" },
  { village: "Howick", lat: -29.48, lng: 30.23, province: "KZN" },
  { village: "Estcourt", lat: -29.0, lng: 29.87, province: "KZN" },
  { village: "Kokstad", lat: -30.55, lng: 29.42, province: "KZN" },

  // ── Free State ──
  { village: "Bloemfontein", lat: -29.0852, lng: 26.1596, province: "FS", extras: ["Mangaung"] },
  { village: "Mangaung", lat: -29.0852, lng: 26.1596, province: "FS" },
  { village: "Welkom", lat: -27.983, lng: 26.733, province: "FS" },
  { village: "Kroonstad", lat: -27.65, lng: 27.23, province: "FS" },
  { village: "Bethlehem", lat: -28.23, lng: 28.3, province: "FS" },
  { village: "Sasolburg", lat: -26.82, lng: 27.82, province: "FS" },
  { village: "Phuthaditjhaba", lat: -28.53, lng: 28.82, province: "FS" },
  { village: "QwaQwa", lat: -28.53, lng: 28.82, province: "FS" },
  { village: "Harrismith", lat: -28.27, lng: 29.13, province: "FS" },

  // ── Limpopo ──
  { village: "Polokwane", lat: -23.9045, lng: 29.4688, province: "LP" },
  { village: "Tzaneen", lat: -23.833, lng: 30.163, province: "LP" },
  { village: "Thohoyandou", lat: -22.945, lng: 30.485, province: "LP" },
  { village: "Mokopane", lat: -24.18, lng: 29.01, province: "LP" },
  { village: "Lebowakgomo", lat: -24.2, lng: 29.5, province: "LP" },
  { village: "Giyani", lat: -23.31, lng: 30.72, province: "LP" },
  { village: "Louis Trichardt", lat: -23.04, lng: 29.9, province: "LP" },
  { village: "Makhado", lat: -23.04, lng: 29.9, province: "LP" },
  { village: "Phalaborwa", lat: -23.95, lng: 31.14, province: "LP" },
  { village: "Musina", lat: -22.35, lng: 30.04, province: "LP" },

  // ── Mpumalanga ──
  { village: "Mbombela", lat: -25.4753, lng: 30.9694, province: "MP", extras: ["Nelspruit"] },
  { village: "Nelspruit", lat: -25.4753, lng: 30.9694, province: "MP" },
  { village: "Witbank", lat: -25.877, lng: 29.233, province: "MP" },
  { village: "eMalahleni", lat: -25.877, lng: 29.233, province: "MP" },
  { village: "Middelburg", lat: -25.775, lng: 29.464, province: "MP" },
  { village: "Secunda", lat: -26.515, lng: 29.2, province: "MP" },
  { village: "Ermelo", lat: -26.533, lng: 29.983, province: "MP" },
  { village: "Standerton", lat: -26.93, lng: 29.24, province: "MP" },
  { village: "Hazyview", lat: -25.04, lng: 31.12, province: "MP" },
  { village: "White River", lat: -25.33, lng: 31.02, province: "MP" },
  { village: "Barberton", lat: -25.79, lng: 31.05, province: "MP" },

  // ── North West ──
  { village: "Mahikeng", lat: -25.865, lng: 25.644, province: "NW", extras: ["Mafikeng"] },
  { village: "Mafikeng", lat: -25.865, lng: 25.644, province: "NW" },
  { village: "Rustenburg", lat: -25.667, lng: 27.242, province: "NW" },
  { village: "Klerksdorp", lat: -26.852, lng: 26.667, province: "NW" },
  { village: "Potchefstroom", lat: -26.715, lng: 27.1, province: "NW" },
  { village: "Brits", lat: -25.635, lng: 27.78, province: "NW" },
  { village: "Lichtenburg", lat: -26.15, lng: 26.16, province: "NW" },
  { village: "Vryburg", lat: -26.96, lng: 24.73, province: "NW" },
  { village: "Mmabatho", lat: -25.85, lng: 25.64, province: "NW" },

  // ── Northern Cape ──
  { village: "Kimberley", lat: -28.7282, lng: 24.7499, province: "NC" },
  { village: "Upington", lat: -28.4478, lng: 21.2561, province: "NC" },
  { village: "Springbok", lat: -29.664, lng: 17.886, province: "NC" },
  { village: "De Aar", lat: -30.65, lng: 24.01, province: "NC" },
  { village: "Kuruman", lat: -27.46, lng: 23.43, province: "NC" },
  { village: "Kathu", lat: -27.7, lng: 23.05, province: "NC" },
  { village: "Calvinia", lat: -31.47, lng: 19.78, province: "NC" },
];

/** Deterministic coords for landmarks (stable across reloads). */
function hashOffset(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((h % 1000) / 1000 - 0.5) * 0.01;
}

function buildPlacesStable(): Place[] {
  const out: Place[] = [];
  for (const v of PLACE_SEEDS) {
    const slug = v.village.toLowerCase().replace(/\s+/g, "-");
    out.push({
      id: `v-${slug}`,
      label: v.village,
      village: v.village,
      kind: "village",
      lat: v.lat,
      lng: v.lng,
      province: v.province,
    });
    for (const hint of LANDMARK_HINTS) {
      const key = `${v.village}-${hint}`;
      out.push({
        id: `l-${key}`.toLowerCase().replace(/\s+/g, "-"),
        label: `${v.village} · ${hint}`,
        village: v.village,
        kind: "landmark",
        lat: v.lat + hashOffset(key + "lat"),
        lng: v.lng + hashOffset(key + "lng"),
        province: v.province,
      });
    }
    for (const extra of v.extras ?? []) {
      out.push({
        id: `x-${slug}-${extra}`.toLowerCase().replace(/\s+/g, "-"),
        label: `${v.village} · ${extra}`,
        village: v.village,
        kind: "landmark",
        lat: v.lat,
        lng: v.lng,
        province: v.province,
      });
    }
  }
  return out;
}

export const PLACES: Place[] = buildPlacesStable();

export const VILLAGE_NAMES = PLACE_SEEDS.map((v) => v.village);

/** @deprecated use LANDMARK_HINTS / PLACES */
export const LANDMARK_SUGGESTIONS = LANDMARK_HINTS;

export function filterLandmarkSuggestions(query: string, limit = 6): string[] {
  return searchPlaces(query, limit).map((p) => p.label);
}

const PROVINCE_LABEL: Record<string, string> = {
  GP: "Gauteng",
  WC: "Western Cape",
  EC: "Eastern Cape",
  KZN: "KwaZulu-Natal",
  FS: "Free State",
  LP: "Limpopo",
  MP: "Mpumalanga",
  NW: "North West",
  NC: "Northern Cape",
};

export function searchPlaces(query: string, limit = 8): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // National default browse: major metros / hubs first
    const hubs = [
      "Johannesburg",
      "Cape Town",
      "Durban",
      "Pretoria",
      "Gqeberha",
      "Bloemfontein",
      "Polokwane",
      "Mbombela",
      "Mthatha",
      "Engcobo",
    ];
    const listed = hubs
      .map((name) => PLACES.find((p) => p.kind === "village" && p.village === name))
      .filter((p): p is Place => Boolean(p));
    return listed.slice(0, limit);
  }

  const scored = PLACES.map((p) => {
    const label = p.label.toLowerCase();
    const village = p.village.toLowerCase();
    const prov = (PROVINCE_LABEL[p.province ?? ""] ?? "").toLowerCase();
    let score = 0;
    if (label === q) score = 100;
    else if (village === q) score = 90;
    else if (label.startsWith(q)) score = 80;
    else if (village.startsWith(q)) score = 70;
    else if (label.includes(q)) score = 50;
    else if (village.includes(q)) score = 40;
    else if (prov.startsWith(q) || prov.includes(q)) score = 25;
    if (p.kind === "village" && score > 0) score += 5;
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.p);
}

export function findPlaceByLabel(label: string): Place | null {
  const q = label.trim().toLowerCase();
  if (!q) return null;
  return (
    PLACES.find((p) => p.label.toLowerCase() === q) ??
    PLACES.find((p) => p.village.toLowerCase() === q) ??
    null
  );
}

export function placeToCoords(place: Place): { lat: number; lng: number } {
  return { lat: place.lat, lng: place.lng };
}

export function provinceName(code?: string): string {
  if (!code) return "";
  return PROVINCE_LABEL[code] ?? code;
}
