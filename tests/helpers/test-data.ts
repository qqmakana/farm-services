/** Shared fixtures for Village Ride E2E (guest phone model — not email auth). */

export const testUsers = {
  driver: {
    /** Mock-store seed id used by local E2E */
    id: "d1",
    name: "Thabo Mbeki Bakkie",
    phone: "27821234567",
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

export const testLocations = {
  pickup: "House with green gate, next to the mango tree",
  dropoff: "Blue house after the church",
  shop: "Qunu Spaza, next to the clinic",
  wearing: "Nike tracksuit",
};

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
