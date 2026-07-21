/** Offline cache for personal saved places (landmark-first, works without signal). */

import type { SavedLocation } from "@/lib/types";

const KEY = "vr_saved_places_cache_v1";

type CacheBlob = {
  phone: string;
  places: SavedLocation[];
  updatedAt: string;
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
