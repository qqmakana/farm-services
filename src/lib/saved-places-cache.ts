/** Offline cache for personal saved places (landmark-first, works without signal). */

import type { SavePersonalLocationInput, SavedLocation } from "@/lib/types";

const KEY = "vr_saved_places_cache_v1";
const PENDING_KEY = "vr_saved_places_pending_v1";

type CacheBlob = {
  phone: string;
  places: SavedLocation[];
  updatedAt: string;
};

type PendingBlob = {
  items: Array<SavePersonalLocationInput & { client_id: string }>;
};

export function readSavedPlacesCache(phone: string): SavedLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CacheBlob;
    if (parsed.phone !== phone) return [];
    return Array.isArray(parsed.places) ? parsed.places : [];
  } catch {
    return [];
  }
}

export function writeSavedPlacesCache(
  phone: string,
  places: SavedLocation[],
): void {
  if (typeof window === "undefined") return;
  try {
    const blob: CacheBlob = {
      phone,
      places,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(blob));
  } catch {
    /* quota / private mode */
  }
}

export function upsertSavedPlaceCache(
  phone: string,
  place: SavedLocation,
): void {
  const existing = readSavedPlacesCache(phone).filter((p) => p.id !== place.id);
  writeSavedPlacesCache(phone, [place, ...existing]);
}

export function removeSavedPlaceCache(phone: string, id: string): void {
  writeSavedPlacesCache(
    phone,
    readSavedPlacesCache(phone).filter((p) => p.id !== id),
  );
}

/** Queue a place save when offline; flushed when connectivity returns. */
export function enqueuePendingPlaceSave(
  input: SavePersonalLocationInput,
): SavedLocation {
  const clientId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}`;
  const row: SavedLocation = {
    id: clientId,
    guest_phone: input.guest_phone.trim(),
    name: input.name.trim(),
    label: input.label?.trim() || input.name.trim(),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    location_id: input.location_id ?? null,
    is_home: Boolean(input.is_home),
    is_work: Boolean(input.is_work),
    is_farm: Boolean(input.is_farm),
    country_code: input.country_code || "ZA",
    created_at: new Date().toISOString(),
  };
  upsertSavedPlaceCache(input.guest_phone, row);
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as PendingBlob)
      : ({ items: [] } as PendingBlob);
    parsed.items = [
      ...parsed.items.filter((i) => i.client_id !== clientId),
      { ...input, client_id: clientId },
    ];
    localStorage.setItem(PENDING_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
  return row;
}

export function readPendingPlaceSaves(): Array<
  SavePersonalLocationInput & { client_id: string }
> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingBlob;
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export function clearPendingPlaceSave(clientId: string): void {
  try {
    const items = readPendingPlaceSaves().filter((i) => i.client_id !== clientId);
    localStorage.setItem(PENDING_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}
