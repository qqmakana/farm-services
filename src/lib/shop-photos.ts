import type { Product, Shop } from "@/lib/types";

/** Local food photos so shops never look like a spreadsheet. */
const SHOP_BANNER: Record<string, string> = {
  food: "/shops/shop-food.jpg",
  groceries: "/shops/shop-groceries.jpg",
  grocery: "/shops/shop-groceries.jpg",
  spaza: "/shops/shop-groceries.jpg",
  bakery: "/shops/shop-bakery.jpg",
  butchery: "/shops/shop-butchery.jpg",
  butcher: "/shops/shop-butchery.jpg",
  farm: "/shops/shop-farm.jpg",
  "farm stall": "/shops/shop-farm.jpg",
  feed: "/shops/shop-farm.jpg",
};

const PRODUCT_PHOTO: { test: RegExp; src: string }[] = [
  { test: /stew|pap|chakalaka|beef/i, src: "/shops/prod-stew.jpg" },
  { test: /chicken|curry|rice/i, src: "/shops/prod-chicken.jpg" },
  { test: /vetkoek|mince|bunny/i, src: "/shops/prod-vetkoek.jpg" },
  { test: /bread|loaf|roll/i, src: "/shops/prod-bread.jpg" },
  { test: /milk|amasi/i, src: "/shops/prod-milk.jpg" },
  { test: /egg/i, src: "/shops/prod-eggs.jpg" },
  { test: /coke|fanta|drink|cola|juice|soda/i, src: "/shops/prod-drink.jpg" },
  { test: /oil|maize|mealie|flour|sugar|rice|salt|tea|coffee/i, src: "/shops/prod-staples.jpg" },
  { test: /soap|sunlight|cleaner/i, src: "/shops/prod-soap.jpg" },
];

export const SHOP_CATEGORY_PILLS = [
  "All",
  "Groceries",
  "Spaza",
  "Food",
  "Bakery",
  "Butchery",
  "Farm Stall",
  "Hardware",
  "Clinic",
] as const;

/** Shop's own banner (or first product photo). Never a stock pap plate. */
export function shopCoverUrl(
  shop: Pick<Shop, "image_url">,
): string | null {
  const url = shop.image_url?.trim();
  return url || null;
}

export function shopCategoryLabel(category: string | null | undefined): string {
  const raw = (category || "shop").trim();
  if (!raw) return "Shop";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function shopBannerSrc(shop: Pick<Shop, "image_url" | "category" | "name">): string {
  const own = shopCoverUrl(shop);
  if (own) return own;
  const cat = (shop.category || "").toLowerCase();
  if (SHOP_BANNER[cat]) return SHOP_BANNER[cat];
  const hay = `${shop.category} ${shop.name}`.toLowerCase();
  if (/kitchen|food|eat|restaurant|braai/.test(hay)) return SHOP_BANNER.food;
  if (/spaza|shoprite|spar|boxer|grocery/.test(hay)) return SHOP_BANNER.groceries;
  if (/bakery|bread/.test(hay)) return SHOP_BANNER.bakery;
  if (/butch|meat/.test(hay)) return SHOP_BANNER.butchery;
  if (/farm|produce|fresh/.test(hay)) return SHOP_BANNER.farm;
  return SHOP_BANNER.groceries;
}

export function productPhotoSrc(
  product: Pick<Product, "image_url" | "name" | "description">,
): string {
  if (product.image_url?.trim()) return product.image_url.trim();
  const hay = `${product.name} ${product.description ?? ""}`;
  for (const row of PRODUCT_PHOTO) {
    if (row.test.test(hay)) return row.src;
  }
  return "/shops/prod-staples.jpg";
}

export function productCategory(name: string): string {
  const n = name.toLowerCase();
  if (/stew|chicken|curry|pap|mince|beef|meat|meal|plate|platter/.test(n))
    return "Meals";
  if (/coke|fanta|drink|cola|juice|soda|amasi/.test(n)) return "Drinks";
  if (/bread|loaf|vetkoek|roll|side|salad|chakalaka/.test(n)) return "Sides";
  if (/soap|cleaner/.test(n)) return "Household";
  if (/oil|maize|flour|sugar|rice|salt|tea|coffee|milk|egg|staple/.test(n))
    return "Staples";
  return "Meals";
}

export function shopPillMatch(shop: Shop, pill: string): boolean {
  if (pill === "All") return true;
  const hay = `${shop.category} ${shop.name} ${shop.description ?? ""} ${shop.notes ?? ""}`.toLowerCase();
  const map: Record<string, RegExp> = {
    Groceries: /groc|spaza|shop|fresh|supermarket/,
    Spaza: /spaza/,
    Food: /food|kitchen|eat|meal|restaurant/,
    Bakery: /baker|bread/,
    Butchery: /butch|meat/,
    "Farm Stall": /farm|produce|fresh/,
    Hardware: /hardware|appliance|furniture/,
    Clinic: /clinic|pharm|chemist/,
  };
  return map[pill]?.test(hay) ?? hay.includes(pill.toLowerCase());
}

export function etaForShop(_shop?: Pick<Shop, "category">): string {
  return "20–40 min";
}
