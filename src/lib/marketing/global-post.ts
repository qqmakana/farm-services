import {
  AVAILABLE_IN_FLAGS,
  GLOBAL_COUNTRY_COUNT,
  MARKET_REGIONS_LABEL,
} from "@/lib/countries";

/** Ready-to-copy global launch post for social / WhatsApp. */
export const GLOBAL_LAUNCH_POST = `🌍 Village Ride is now available in ${GLOBAL_COUNTRY_COUNT} countries!

${AVAILABLE_IN_FLAGS} + ${GLOBAL_COUNTRY_COUNT - AVAILABLE_IN_FLAGS.split(" ").filter(Boolean).length} more

Every continent · villages & small towns worldwide

Landmark booking · Cash & Card · Drivers keep 90%

Trip · Fetch · Send · Shops — opens end of September

https://village-ride.vercel.app
https://village-ride.vercel.app/countries

#VillageRide #RuralLogistics #Global`;

export function globalPostForCountry(countryName: string, flag: string): string {
  return `${flag} Village Ride is live in ${countryName}!

Trip, Fetch, Send and Shops. Opens end of September.
Landmark booking. Cash & Card. Drivers keep 90%.

Open: https://village-ride.vercel.app
Drive: https://village-ride.vercel.app/driver/join

${GLOBAL_COUNTRY_COUNT} countries across ${MARKET_REGIONS_LABEL}.`;
}
