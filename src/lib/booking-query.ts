import { findPlaceByLabel } from "@/lib/landmarks";

export type BookingLoc = {
  lat: number | null;
  lng: number | null;
  landmark: string;
};

/** Parse ?from=&to=&fromLat=&fromLng=&toLat=&toLng= into Loc pairs. */
export function locsFromSearchParams(sp: URLSearchParams | {
  get(name: string): string | null;
}): { pickup: BookingLoc; dropoff: BookingLoc } {
  const from = sp.get("from")?.trim() ?? "";
  const to = sp.get("to")?.trim() ?? "";
  const fromLat = num(sp.get("fromLat"));
  const fromLng = num(sp.get("fromLng"));
  const toLat = num(sp.get("toLat"));
  const toLng = num(sp.get("toLng"));

  let pickup: BookingLoc = {
    landmark: from,
    lat: fromLat,
    lng: fromLng,
  };
  let dropoff: BookingLoc = {
    landmark: to,
    lat: toLat,
    lng: toLng,
  };

  if (pickup.landmark && (pickup.lat == null || pickup.lng == null)) {
    const p = findPlaceByLabel(pickup.landmark);
    if (p) pickup = { landmark: p.label, lat: p.lat, lng: p.lng };
  }
  if (dropoff.landmark && (dropoff.lat == null || dropoff.lng == null)) {
    const p = findPlaceByLabel(dropoff.landmark);
    if (p) dropoff = { landmark: p.label, lat: p.lat, lng: p.lng };
  }

  if (!pickup.landmark) pickup = { landmark: "", lat: null, lng: null };
  if (!dropoff.landmark) dropoff = { landmark: "", lat: null, lng: null };

  return { pickup, dropoff };
}

function num(v: string | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
