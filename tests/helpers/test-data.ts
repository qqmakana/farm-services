/** Shared fixtures for Village Ride E2E (guest phone model — not email auth). */

export const testUsers = {
  driver: {
    /** Mock-store seed — sedan so Ride matching fits (d1 is bakkie-only). */
    id: "d2",
    name: "Nomsa Lift Club",
    phone: "27829876543",
    vehicle: "Sedan",
    plate: "EC 987-654",
  },
  rider: {
    name: "E2E Rider",
    phone: "0825550199",
  },
  shop: {
    name: "E2E Spaza Test",
    email: `test+shop-${Date.now()}@village-ride.co.za`,
    phone: "0825550188",
  },
};

/**
 * In-service pins (ZA). Johannesburg and Mthatha both work.
 */
export const testLocations = {
  pickup: "Mthatha Taxi Rank",
  dropoff: "Engcobo Main Street",
  shop: "Qunu Spaza, next to the clinic",
  wearing: "Nike tracksuit",
  /** Road pins near mock online drivers (d1/d2/d3). */
  pickupPin: { lat: -31.588, lng: 28.784 },
  dropoffPin: { lat: -31.595, lng: 28.795 },
};

/** Build /ride deep-link with pinned coords so fare quote is ready. */
export function rideBookingUrl(opts?: {
  pickup?: string;
  dropoff?: string;
  pickupPin?: { lat: number; lng: number };
  dropoffPin?: { lat: number; lng: number };
}) {
  const pickup = opts?.pickup ?? testLocations.pickup;
  const dropoff = opts?.dropoff ?? testLocations.dropoff;
  const from = opts?.pickupPin ?? testLocations.pickupPin;
  const to = opts?.dropoffPin ?? testLocations.dropoffPin;
  const q = new URLSearchParams({
    from: pickup,
    to: dropoff,
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toLat: String(to.lat),
    toLng: String(to.lng),
  });
  return `/ride?${q.toString()}`;
}

export const FEATURE_ROUTES = [
  { path: "/", name: "Home" },
  { path: "/ride", name: "Ride" },
  { path: "/delivery", name: "Delivery" },
  { path: "/farm", name: "Farm" },
  { path: "/courier", name: "Courier" },
  { path: "/shops", name: "Shops" },
  { path: "/shop", name: "Shop signup" },
  { path: "/partners", name: "Partners" },
  { path: "/help", name: "Help" },
  { path: "/pricing", name: "Pricing" },
  { path: "/countries", name: "Countries" },
  { path: "/privacy", name: "Privacy" },
  { path: "/terms", name: "Terms" },
  { path: "/wear-stats", name: "Wear stats" },
  { path: "/get-app", name: "Get app" },
  { path: "/driver", name: "Driver gate" },
  { path: "/driver/join", name: "Driver join" },
  { path: "/account/places", name: "Saved places" },
  { path: "/dispatch", name: "Dispatch" },
] as const;
