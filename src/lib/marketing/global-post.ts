import {
  AVAILABLE_IN_FLAGS,
  GLOBAL_COUNTRY_COUNT,
  MARKET_REGIONS_LABEL,
} from "@/lib/countries";

/** Ready-to-copy global launch post for social / WhatsApp. */
export const GLOBAL_LAUNCH_POST = `🌍 Village Ride is now available in ${GLOBAL_COUNTRY_COUNT} countries across 3 continents!

${AVAILABLE_IN_FLAGS}

Africa · Asia · Latin America

We serve villages — not Uber cities. That's why we're not in the US or UK.
Landmark booking · Cash payment · Drivers keep 85%

🚗 Rides · 📦 Delivery · 🚜 Farm · 📦 Courier

https://village-ride.vercel.app
https://village-ride.vercel.app/countries

#VillageRide #RuralLogistics #EmergingMarkets`;

export function globalPostForCountry(countryName: string, flag: string): string {
  return `${flag} Village Ride is live in ${countryName}!

Rural rides, delivery, farm & courier — built for villages, not big-city apps.
Landmark booking. Cash payment. Drivers keep 85%.

Open: https://village-ride.vercel.app
Drive: https://village-ride.vercel.app/driver/join

${GLOBAL_COUNTRY_COUNT} countries across ${MARKET_REGIONS_LABEL}.`;
}
