import { AVAILABLE_IN_FLAGS, GLOBAL_COUNTRY_COUNT } from "@/lib/countries";

/** Ready-to-copy global launch post for social / WhatsApp. */
export const GLOBAL_LAUNCH_POST = `🌍 Village Ride is now available in ${GLOBAL_COUNTRY_COUNT} countries!

${AVAILABLE_IN_FLAGS}

What we do:
🚗 Rides — village to village
📦 Delivery — store to door
🚜 Farm — produce & livestock
📦 Courier — send packages

Why we're different:
✅ Landmark-based booking — no street address needed
✅ Cash payment — no bank account required
✅ 85% driver earnings — fair for everyone

Download: https://village-ride.vercel.app
Countries: https://village-ride.vercel.app/countries

#VillageRide #RuralLogistics #Global`;

export function globalPostForCountry(countryName: string, flag: string): string {
  return `${flag} Village Ride is live in ${countryName}!

Rural rides, delivery, farm & courier.
Landmark booking. Cash payment. Drivers keep 85%.

Open: https://village-ride.vercel.app
Drive: https://village-ride.vercel.app/driver/join

${GLOBAL_COUNTRY_COUNT} countries worldwide — same village problems, same fix.`;
}
