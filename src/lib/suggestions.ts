import { distanceKm } from "./geo";
import { getBoostConfig } from "./boost";

export type SuggestionKind = "saved" | "recent" | "nearby";

export type PlaceSuggestion = {
  type: SuggestionKind;
  id: string;
  label?: "home" | "work" | "farm" | "other";
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  distance?: string;
  distance_km?: number;
  ride_count?: number;
  category?: string;
  /** Job that created a recent, when known. */
  service_hint?: "ride" | "delivery" | "farm" | "courier" | "shops" | "groups";
};

export type HomeFeedTab =
  | "for-you"
  | "trip"
  | "reserve"
  | "groups"
  | "delivery"
  | "courier"
  | "farm"
  | "shops";

const TAB_NEARBY: Record<HomeFeedTab, string[] | null> = {
  "for-you": null,
  trip: [
    "restaurant",
    "fast_food",
    "university",
    "school",
    "hospital",
    "taxi",
    "mall",
    "bus_station",
    "default",
  ],
  reserve: [
    "restaurant",
    "university",
    "hospital",
    "taxi",
    "mall",
    "bus_station",
    "default",
  ],
  groups: ["university", "taxi", "mall", "bus_station", "default"],
  delivery: ["shop", "grocery", "mall", "default"],
  courier: ["shop", "mall", "university", "taxi", "default"],
  farm: ["grocery", "shop", "default"],
  shops: ["grocery", "mall", "restaurant", "fast_food", "shop"],
};

export function suggestionMatchesTab(
  place: PlaceSuggestion,
  tab: HomeFeedTab,
): boolean {
  if (tab === "for-you") return true;
  if (place.type === "saved") {
    if (tab === "farm") return place.label === "farm" || place.label === "other";
    if (tab === "shops" || tab === "delivery" || tab === "courier") {
      return place.label !== "farm";
    }
    return true;
  }
  if (place.type === "recent") {
    const hint = place.service_hint;
    if (tab === "trip" || tab === "reserve" || tab === "groups") {
      return !hint || hint === "ride" || hint === "groups";
    }
    if (tab === "delivery") return hint === "delivery";
    if (tab === "courier") return hint === "courier";
    if (tab === "farm") return hint === "farm" || place.label === "farm";
    if (tab === "shops") return hint === "shops" || hint === "delivery";
    return true;
  }
  const allowed = TAB_NEARBY[tab];
  if (!allowed) return true;
  return allowed.includes(place.category || "default");
}

export function filterSuggestionsForTab(
  data: SuggestionsPayload,
  tab: HomeFeedTab,
): SuggestionsPayload {
  if (tab === "for-you") return data;
  return {
    saved: data.saved.filter((p) => suggestionMatchesTab(p, tab)),
    recent: data.recent.filter((p) => suggestionMatchesTab(p, tab)),
    nearby: data.nearby.filter((p) => suggestionMatchesTab(p, tab)),
  };
}

export function bookingPathForTab(tab: HomeFeedTab): string {
  switch (tab) {
    case "reserve":
      return "/ride?when=later";
    case "groups":
      return "/group";
    case "delivery":
      return "/delivery";
    case "courier":
      return "/courier";
    case "farm":
      return "/farm";
    case "shops":
      return "/shops";
    default:
      return "/ride";
  }
}

/** Tabs that open a dedicated screen instead of filtering the home feed. */
export const HOME_NAV_TABS: HomeFeedTab[] = ["groups", "farm", "shops"];

export function homeTabOpensPage(tab: HomeFeedTab): boolean {
  return HOME_NAV_TABS.includes(tab);
}

export function homeTabLabel(tab: HomeFeedTab): string {
  switch (tab) {
    case "for-you":
      return "For you";
    case "trip":
      return "Trip";
    case "reserve":
      return "Reserve";
    case "groups":
      return "Groups";
    case "delivery":
      return "Delivery";
    case "courier":
      return "Courier";
    case "farm":
      return "Farm";
    case "shops":
      return "Shops";
  }
}

export type SuggestionsPayload = {
  saved: PlaceSuggestion[];
  recent: PlaceSuggestion[];
  nearby: PlaceSuggestion[];
};

const OBSCURE =
  /^(unnamed|parking|lot|stop|node|null|\d+)$/i;

export function isRecognizableName(name: string): boolean {
  const t = name.trim();
  if (t.length < 3) return false;
  if (OBSCURE.test(t)) return false;
  if (/^\d+\s*(st|rd|ave|street)?$/i.test(t)) return false;
  return true;
}

export function formatSuggestionDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 0.05) return "Nearby";
  if (km < 1) return `${(Math.round(km * 10) / 10).toFixed(1)} km`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function samePlace(
  a: { lat: number | null; lng: number | null; name: string },
  b: { lat: number | null; lng: number | null; name: string },
): boolean {
  const na = normalizePlaceName(a.name);
  const nb = normalizePlaceName(b.name);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const close =
    a.lat != null &&
    a.lng != null &&
    b.lat != null &&
    b.lng != null &&
    distanceKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) < 0.12;
  if (!close) return false;
  return na.includes(nb) || nb.includes(na);
}

export function normalizePlaceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function nameHitsBoost(name: string, key: string): boolean {
  if (!key) return false;
  if (key.length <= 3) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, "i").test(name);
  }
  return name.includes(key);
}

export function scoreNearbyPlace(opts: {
  name: string;
  category?: string;
  distanceKm: number;
  countryCode?: string | null;
}): number {
  const boost = getBoostConfig(opts.countryCode);
  let score = 0;
  if (opts.distanceKm < 0.5) score += 10;
  else if (opts.distanceKm < 1) score += 7;
  else if (opts.distanceKm < 2) score += 4;
  else if (opts.distanceKm < 3) score += 2;

  const name = normalizePlaceName(opts.name);
  for (const [key, value] of Object.entries(boost.names)) {
    if (nameHitsBoost(name, key)) score += value;
  }
  if (opts.category) {
    score += boost.categories[opts.category] ?? 0;
  }
  return score;
}

export function mergeSuggestionLists(opts: {
  saved: PlaceSuggestion[];
  recent: PlaceSuggestion[];
  nearby: PlaceSuggestion[];
}): SuggestionsPayload {
  const saved = opts.saved.filter((p) => isRecognizableName(p.name));
  const recent: PlaceSuggestion[] = [];
  for (const p of opts.recent) {
    if (!isRecognizableName(p.name)) continue;
    if (saved.some((s) => samePlace(s, p))) continue;
    if (recent.some((r) => samePlace(r, p))) continue;
    recent.push(p);
  }
  const nearby: PlaceSuggestion[] = [];
  for (const p of opts.nearby) {
    if (!isRecognizableName(p.name)) continue;
    if (saved.some((s) => samePlace(s, p))) continue;
    if (recent.some((r) => samePlace(r, p))) continue;
    if (nearby.some((n) => samePlace(n, p))) continue;
    nearby.push(p);
  }
  return {
    saved: saved.slice(0, 6),
    recent: recent.slice(0, 5),
    nearby: nearby.slice(0, 10),
  };
}

export function categoryFromText(
  name: string,
  raw?: string | null,
): string {
  const blob = `${raw || ""} ${name}`.toLowerCase();
  if (/taxi|rank/.test(blob)) return "taxi";
  if (/mall|centre|center|waterfront/.test(blob)) return "mall";
  if (/university|campus|uj|wits|unisa|uct/.test(blob)) return "university";
  if (/school|college/.test(blob)) return "school";
  if (/hospital|clinic|baragwanath/.test(blob)) return "hospital";
  if (/shell|engen|bp |total |garage|petrol|fuel/.test(blob)) return "fuel";
  if (/shoprite|checkers|spar|pick n pay|grocery/.test(blob)) return "grocery";
  if (/kfc|mcdonald|steers|nando|hungry lion|fast/.test(blob)) return "fast_food";
  if (/restaurant|cafe|eatery/.test(blob)) return "restaurant";
  if (/bus|station|gautrain/.test(blob)) return "bus_station";
  if (/shop|store/.test(blob)) return "shop";
  return raw?.trim() || "default";
}
