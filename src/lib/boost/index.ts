import { saBoost, saCategoryBoost } from "./za";
import { ngBoost, ngCategoryBoost } from "./ng";
import { keBoost, keCategoryBoost } from "./ke";

export type BoostConfig = {
  names: Record<string, number>;
  categories: Record<string, number>;
};

const BOOSTS: Record<string, BoostConfig> = {
  ZA: { names: saBoost, categories: saCategoryBoost },
  NG: { names: ngBoost, categories: ngCategoryBoost },
  KE: { names: keBoost, categories: keCategoryBoost },
};

export function getBoostConfig(countryCode?: string | null): BoostConfig {
  const code = (countryCode || "ZA").toUpperCase();
  return BOOSTS[code] ?? { names: {}, categories: {} };
}
