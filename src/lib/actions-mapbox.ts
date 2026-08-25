"use server";

import type { AddressSuggestion, DrivingRoute } from "./mapbox-types";
import {
  geocodeAddressQuery,
  getDrivingRoute,
} from "./mapbox-server";
import { searchServiceAreaLandmarks } from "./service-area";

export type AddressSearchResult = {
  results: AddressSuggestion[];
  notFound: boolean;
  usedLandmarkFallback: boolean;
};

export async function searchAddressesAction(
  query: string,
  countryCode = "ZA",
  proximity?: { lat: number; lng: number } | null,
): Promise<AddressSearchResult> {
  const q = query.trim();
  if (q.length < 2) {
    return { results: [], notFound: false, usedLandmarkFallback: false };
  }

  let mapbox: AddressSuggestion[] = [];
  try {
    mapbox = await geocodeAddressQuery(q, {
      countryCode,
      proximity,
      limit: 6,
    });
  } catch {
    mapbox = [];
  }

  if (mapbox.length > 0) {
    return {
      results: mapbox,
      notFound: false,
      usedLandmarkFallback: false,
    };
  }

  const landmarks = searchServiceAreaLandmarks(q, 6, countryCode).map(
    (place): AddressSuggestion => ({
      id: `landmark:${place.id}`,
      label: place.label,
      lat: place.lat,
      lng: place.lng,
      relevance: 1,
      accuracy: "poi",
      needsConfirmation: true,
      source: "landmark",
      inServiceArea: true,
    }),
  );

  return {
    results: landmarks,
    notFound: landmarks.length === 0,
    usedLandmarkFallback: landmarks.length > 0,
  };
}

export async function getDrivingRouteAction(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingRoute> {
  return getDrivingRoute(from, to);
}
