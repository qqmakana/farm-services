/**
 * Founding Driver Bonus Pool — performance incentive program.
 * Do NOT describe as equity, shares, ownership, or dividends.
 */

export const FOUNDING_ERA_CUTOFF_ISO = "2029-08-05T23:59:59+02:00";

/** Canonical SA home cities for the bonus pool. */
export const FOUNDING_CITIES = [
  "Johannesburg",
  "Cape Town",
  "Durban",
  "Pretoria",
] as const;

export type FoundingCity = (typeof FOUNDING_CITIES)[number];

export const FOUNDING_APP_URL = "village-ride.vercel.app";

/** Hard cutoff — server-side only for qualification writes. */
export function isWithinFoundingEra(now = new Date()): boolean {
  return now.getTime() <= new Date(FOUNDING_ERA_CUTOFF_ISO).getTime();
}

export function daysLeftInFoundingEra(now = new Date()): number {
  const ms = new Date(FOUNDING_ERA_CUTOFF_ISO).getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function monthYearKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Map free-text area / town → canonical city when possible. */
export function normalizeHomeCity(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toLowerCase();

  const aliases: Record<string, FoundingCity> = {
    johannesburg: "Johannesburg",
    joburg: "Johannesburg",
    "jo'burg": "Johannesburg",
    jhb: "Johannesburg",
    gauteng: "Johannesburg",
    sandton: "Johannesburg",
    soweto: "Johannesburg",
    midrand: "Johannesburg",
    "cape town": "Cape Town",
    capetown: "Cape Town",
    cpt: "Cape Town",
    western: "Cape Town",
    durban: "Durban",
    dbn: "Durban",
    "kwazulu-natal": "Durban",
    kzn: "Durban",
    pretoria: "Pretoria",
    tshwane: "Pretoria",
    pta: "Pretoria",
  };

  for (const [key, city] of Object.entries(aliases)) {
    if (t === key || t.includes(key)) return city;
  }

  // Exact canonical match (case-insensitive)
  for (const city of FOUNDING_CITIES) {
    if (t === city.toLowerCase()) return city;
  }

  // Keep trimmed original if not mapped (still usable for pool keying)
  return raw.trim();
}

export function randsToCents(rands: number): number {
  return Math.max(0, Math.round(Number(rands) || 0) * 100);
}

export function centsToRands(cents: number): number {
  return Math.round(Number(cents) || 0) / 100;
}

export function foundingBonusPayoutWhatsAppHref(params: {
  driverId: string;
  driverName: string;
  city: string;
  balanceCents: number;
  phoneWhatsApp: string;
}): string {
  const rands = (params.balanceCents / 100).toFixed(2);
  const text = [
    `Hi Village Ride — Founding Driver Bonus payout request.`,
    `Driver: ${params.driverName}`,
    `ID: ${params.driverId}`,
    `City: ${params.city}`,
    `Accumulated bonus: R${rands}`,
  ].join("\n");
  return `https://wa.me/${params.phoneWhatsApp}?text=${encodeURIComponent(text)}`;
}
