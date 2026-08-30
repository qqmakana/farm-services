import type { Shop } from "@/lib/types";

/** Match typed Fetch text ("2 loaves from Mama's") to a listed shop. */
export function matchListedShop(
  shops: Shop[],
  queries: string[],
): Shop | null {
  const hay = queries
    .map((q) => q.trim().toLowerCase())
    .filter((q) => q.length >= 2)
    .join(" ");
  if (hay.length < 3) return null;

  let best: { shop: Shop; score: number } | null = null;
  for (const shop of shops) {
    const name = shop.name.trim();
    if (name.length < 3) continue;
    const n = name.toLowerCase();
    let score = 0;
    if (hay.includes(n)) score += 100 + n.length;
    else if (hay.trim().length >= 3 && n.includes(hay.trim())) {
      score += 80 + hay.trim().length;
    }
    const parts = n
      .split(/\s+/)
      .filter((w) => w.replace(/[^a-z0-9]/g, "").length >= 3);
    const hits = parts.filter((p) => hay.includes(p)).length;
    if (hits) score += hits * 20 + (hits === parts.length ? 30 : 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { shop, score };
    }
  }
  return best?.shop ?? null;
}
