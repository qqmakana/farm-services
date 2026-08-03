/**
 * Free, offline country detection for first-open lock.
 * Prefer timezone, then navigator language region. No IP API (R0 budget).
 */

import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  isCountryCode,
  type CountryCode,
} from "./countries";

/**
 * Common IANA zones → ISO country. Ambiguous zones pick the primary market
 * Village Ride cares about (e.g. Africa/Lagos → NG, not BJ).
 */
const ZONE_TO_COUNTRY: Record<string, CountryCode> = {
  "Africa/Johannesburg": "ZA",
  "Africa/Nairobi": "KE",
  "Africa/Lagos": "NG",
  "Africa/Accra": "GH",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Addis_Ababa": "ET",
  "Africa/Kampala": "UG",
  "Africa/Kigali": "RW",
  "Africa/Harare": "ZW",
  "Africa/Lusaka": "ZM",
  "Africa/Maputo": "MZ",
  "Africa/Gaborone": "BW",
  "Africa/Windhoek": "NA",
  "Africa/Maseru": "LS",
  "Africa/Mbabane": "SZ",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Manila": "PH",
  "Asia/Jakarta": "ID",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Bangkok": "TH",
  "Asia/Almaty": "KZ",
  "Asia/Tashkent": "UZ",
  "Asia/Bishkek": "KG",
  "Asia/Ulaanbaatar": "MN",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG",
  "Asia/Seoul": "KR",
  "America/Sao_Paulo": "BR",
  "America/Mexico_City": "MX",
  "America/Bogota": "CO",
  "America/Lima": "PE",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Pacific/Auckland": "NZ",
};

function countryFromTimezone(tz: string): CountryCode | null {
  if (ZONE_TO_COUNTRY[tz]) return ZONE_TO_COUNTRY[tz];

  // Match configured country timezones (featured markets)
  for (const c of Object.values(COUNTRIES)) {
    if (c.timezone && c.timezone !== "UTC" && c.timezone === tz) {
      return c.code;
    }
  }

  // Continent/city prefix heuristics for Africa_* etc.
  const city = tz.split("/").pop()?.replace(/_/g, " ");
  if (city) {
    const hit = Object.values(COUNTRIES).find(
      (c) => c.name.toLowerCase() === city.toLowerCase(),
    );
    if (hit) return hit.code;
  }
  return null;
}

function countryFromNavigatorLanguage(): CountryCode | null {
  if (typeof navigator === "undefined") return null;
  const tags = [navigator.language, ...(navigator.languages || [])];
  for (const tag of tags) {
    if (!tag) continue;
    try {
      // Intl.Locale.maximize adds likely region (e.g. en → en-US)
      const loc = new Intl.Locale(tag);
      const maximized =
        typeof loc.maximize === "function" ? loc.maximize() : loc;
      const region = maximized.region || loc.region;
      if (region && isCountryCode(region) && COUNTRIES[region]?.enabled) {
        return region;
      }
    } catch {
      const m = tag.match(/-([A-Z]{2})\b/i);
      if (m && isCountryCode(m[1].toUpperCase())) {
        return m[1].toUpperCase() as CountryCode;
      }
    }
  }
  return null;
}

/** Browser timezone via Intl (no network). */
export function getBrowserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Best-effort country for first load before the user locks a pick.
 * Order: timezone → language region → ZA default.
 */
export function detectCountryFromBrowser(): CountryCode {
  const tz = getBrowserTimeZone();
  if (tz) {
    const fromTz = countryFromTimezone(tz);
    if (fromTz) return fromTz;
  }
  const fromLang = countryFromNavigatorLanguage();
  if (fromLang) return fromLang;
  return DEFAULT_COUNTRY;
}
