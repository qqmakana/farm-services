/** Clothing / brand helpers for "What You're Wearing". */

export const TRACKED_WEAR_BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "Under Armour",
  "New Balance",
  "Converse",
  "Vans",
  "Jordan",
  "Gucci",
  "Louis Vuitton",
  "Supreme",
] as const;

export type TrackedWearBrand = (typeof TRACKED_WEAR_BRANDS)[number] | "Other";

const BRAND_ALIASES: Array<{ brand: TrackedWearBrand; pattern: RegExp }> = [
  { brand: "Nike", pattern: /\b(nike|swoosh|air\s*force|air\s*max|jordan)\b/i },
  { brand: "Jordan", pattern: /\bjordan\b/i },
  { brand: "Adidas", pattern: /\b(adidas|adi.?das|three\s*stripes|yeezy)\b/i },
  { brand: "Puma", pattern: /\bpuma\b/i },
  { brand: "Reebok", pattern: /\breebok\b/i },
  { brand: "Under Armour", pattern: /\b(under\s*armour|under\s*armor|\bua\b)\b/i },
  { brand: "New Balance", pattern: /\b(new\s*balance|\bnb\b)\b/i },
  { brand: "Converse", pattern: /\b(converse|chuck\s*taylor)\b/i },
  { brand: "Vans", pattern: /\bvans\b/i },
  { brand: "Gucci", pattern: /\bgucci\b/i },
  { brand: "Louis Vuitton", pattern: /\b(louis\s*vuitton|\blv\b)\b/i },
  { brand: "Supreme", pattern: /\bsupreme\b/i },
];

export function extractWearBrand(description: string): TrackedWearBrand {
  const text = description.trim();
  if (!text) return "Other";
  for (const { brand, pattern } of BRAND_ALIASES) {
    if (pattern.test(text)) return brand;
  }
  return "Other";
}

export type WearLogRow = {
  description: string;
  brand: string | null;
  country: string | null;
  created_at: string;
};

export type WearBrandRank = { brand: string; count: number };

export type WearCountryTrend = {
  country: string;
  flag: string;
  topBrand: string;
  count: number;
};

export type WearStats = {
  todayTotal: number;
  weekTotal: number;
  mostWornBrandToday: string | null;
  brandRankings: WearBrandRank[];
  mostCommonOutfit: string | null;
  countryTrends: WearCountryTrend[];
  wearOfTheWeek: { description: string; brand: string; count: number } | null;
  socialCaption: string;
};

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcWeek(d = new Date()) {
  const day = startOfUtcDay(d);
  const dow = day.getUTCDay(); // 0 Sun
  day.setUTCDate(day.getUTCDate() - dow);
  return day;
}

function normalizeDesc(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export function aggregateWearStats(
  rows: WearLogRow[],
  countryMeta: (code: string | null) => { name: string; flag: string },
): WearStats {
  const now = new Date();
  const todayStart = startOfUtcDay(now).getTime();
  const weekStart = startOfUtcWeek(now).getTime();

  const today = rows.filter((r) => new Date(r.created_at).getTime() >= todayStart);
  const week = rows.filter((r) => new Date(r.created_at).getTime() >= weekStart);

  const countBrand = (list: WearLogRow[]) => {
    const map = new Map<string, number>();
    for (const r of list) {
      const b = (r.brand && r.brand.trim()) || extractWearBrand(r.description);
      map.set(b, (map.get(b) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
  };

  const todayBrands = countBrand(today);
  const weekBrands = countBrand(week.length ? week : rows);

  const outfitMap = new Map<string, { raw: string; count: number; brand: string }>();
  for (const r of week.length ? week : rows) {
    const key = normalizeDesc(r.description);
    if (!key) continue;
    const brand = (r.brand && r.brand.trim()) || extractWearBrand(r.description);
    const prev = outfitMap.get(key);
    if (prev) prev.count += 1;
    else outfitMap.set(key, { raw: r.description.trim(), count: 1, brand });
  }
  const topOutfit = [...outfitMap.values()].sort(
    (a, b) => b.count - a.count || a.raw.localeCompare(b.raw),
  )[0];

  const byCountry = new Map<string, WearLogRow[]>();
  for (const r of week.length ? week : rows) {
    const c = (r.country || "ZA").toUpperCase();
    const list = byCountry.get(c) ?? [];
    list.push(r);
    byCountry.set(c, list);
  }
  const countryTrends: WearCountryTrend[] = [...byCountry.entries()]
    .map(([code, list]) => {
      const ranks = countBrand(list);
      const meta = countryMeta(code);
      return {
        country: meta.name,
        flag: meta.flag,
        topBrand: ranks[0]?.brand ?? "Other",
        count: list.length,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const nike = todayBrands.find((b) => b.brand === "Nike")?.count ?? 0;
  const adidas = todayBrands.find((b) => b.brand === "Adidas")?.count ?? 0;
  const puma = todayBrands.find((b) => b.brand === "Puma")?.count ?? 0;
  const socialCaption =
    today.length === 0
      ? "Village Ride Wear Check: no outfit logs yet today — hop in a ride and tell us what you're wearing."
      : `Today on Village Ride, ${nike} rider${nike === 1 ? "" : "s"} wore Nike. ${adidas} wore Adidas. ${puma} wore Puma.`;

  return {
    todayTotal: today.length,
    weekTotal: week.length,
    mostWornBrandToday: todayBrands[0]?.brand ?? null,
    brandRankings: weekBrands.slice(0, 10),
    mostCommonOutfit: topOutfit?.raw ?? null,
    countryTrends,
    wearOfTheWeek: topOutfit
      ? {
          description: topOutfit.raw,
          brand: topOutfit.brand,
          count: topOutfit.count,
        }
      : null,
    socialCaption,
  };
}
