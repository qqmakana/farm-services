"use client";

import { useMemo, useState } from "react";
import { AppLink } from "@/components/ui/app-link";
import { MapPin, Search, ShoppingBag, Star } from "lucide-react";
import type { Shop } from "@/lib/types";
import { SHOP_DELIVERY_FEE, SHOP_MIN_ORDER } from "@/lib/shop-constants";
import {
  SHOP_CATEGORY_PILLS,
  etaForShop,
  shopCategoryLabel,
  shopCoverUrl,
  shopPillMatch,
} from "@/lib/shop-photos";
import { ShopPhoto } from "@/components/shops/shop-photo";
import { formatMoney } from "@/lib/format";
import { ShopsHowItWorks } from "@/components/shops/shops-how-it-works";
import { useCountry } from "@/components/country/country-provider";

export function ShopStorefront({ shops }: { shops: Shop[] }) {
  const { country } = useCountry();
  const [q, setQ] = useState("");
  const [pill, setPill] = useState<(typeof SHOP_CATEGORY_PILLS)[number]>("All");
  const place =
    country.code === "ZA"
      ? "Westdene, Johannesburg"
      : `${country.name}`;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return shops.filter((shop) => {
      if (!shopPillMatch(shop, pill)) return false;
      if (!needle) return true;
      const hay =
        `${shop.name} ${shop.category} ${shop.description ?? ""} ${shop.notes ?? ""} ${shop.landmark}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [shops, q, pill]);

  return (
    <div className="vr-page-enter touch-manipulation pb-8">
      <header className="sticky top-0 z-20 -mx-4 bg-[#f3f3f3]/95 px-4 pb-3 pt-1 backdrop-blur-sm">
        <p className="flex items-center gap-1 text-[12px] font-medium text-[#6B6B6B]">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {place}
        </p>
        <label className="mt-2 flex items-center gap-2 rounded-[24px] border border-[#E8E8E8] bg-white px-3.5 py-3">
          <Search className="h-5 w-5 shrink-0 text-[#8A8A8A]" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shops or products"
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#A6A6A6]"
            enterKeyHint="search"
            data-testid="shop-find"
          />
        </label>
        <div
          className="vr-hide-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4"
          role="tablist"
          aria-label="Shop categories"
        >
          {SHOP_CATEGORY_PILLS.map((name) => {
            const on = pill === name;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPill(name)}
                className={`uber-press shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold ${
                  on
                    ? "bg-black text-white"
                    : "border border-[#E8E8E8] bg-white text-black"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="mt-10 px-2 text-center">
          <ShoppingBag
            className="mx-auto h-10 w-10 text-[#C4C4C4]"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="mt-4 text-[18px] font-bold text-[#3D3D3D]">
            {shops.length === 0
              ? "No shops nearby yet"
              : "No shops match that search"}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#8A8A8A]">
            We&apos;re adding local spazas and grocery stores daily.
          </p>
          <AppLink
            href="/delivery?kind=shop"
            data-testid="shop-know"
            className="uber-press mt-6 inline-flex min-h-11 items-center rounded-full bg-black px-5 text-sm font-bold text-white"
          >
            Browse with Fetch instead
          </AppLink>
          <p className="mt-5 text-[12px] font-semibold tracking-wide text-[#C4C4C4]">
            ─── OR ───
          </p>
          <AppLink
            href="/merchant/register"
            className="uber-press mt-4 inline-flex min-h-11 items-center rounded-full border border-black px-5 text-sm font-bold text-black"
          >
            I own a shop — Join Village
          </AppLink>
        </div>
      ) : (
        <div id="find-shop" className="mt-3 space-y-4">
          {filtered.map((shop) => {
            const cover = shopCoverUrl(shop);
            return (
              <AppLink
                key={shop.id}
                href={`/shops/${shop.id}`}
                className="uber-press block overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-100 active:scale-[0.98]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#1A1A1A]">
                  {cover ? (
                    <ShopPhoto
                      src={cover}
                      alt=""
                      fallback=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-end bg-[linear-gradient(160deg,#2b2b2b_0%,#5a4636_55%,#8a6a4a_100%)] px-4 pb-4"
                      aria-hidden
                    >
                      <p className="text-[20px] font-bold leading-tight text-white">
                        {shop.name}
                      </p>
                    </div>
                  )}
                  {shop.is_active ? (
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-[#06c167] px-2 py-0.5 text-[10px] font-bold text-white">
                      Open now
                    </span>
                  ) : null}
                </div>
                <div className="px-3.5 py-3">
                  <p className="text-[18px] font-bold leading-tight text-black">
                    {shop.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[14px] font-semibold text-[#3D3D3D]">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {shop.rating_avg != null
                      ? shop.rating_avg.toFixed(1)
                      : "New"}
                    {shop.rating_count ? (
                      <span className="font-medium text-[#8A8A8A]">
                        ({shop.rating_count})
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-1.5 flex items-start justify-between gap-3 text-[14px] text-[#6B6B6B]">
                    <p>
                      {shopCategoryLabel(shop.category)} · {etaForShop(shop)} ·{" "}
                      {formatMoney(SHOP_DELIVERY_FEE)}
                    </p>
                    <p className="shrink-0 text-right text-[#8A8A8A]">
                      Min. order {formatMoney(SHOP_MIN_ORDER)}
                    </p>
                  </div>
                </div>
              </AppLink>
            );
          })}
        </div>
      )}

      {filtered.length > 0 ? (
        <>
          <ShopsHowItWorks />
          <AppLink
            href="/delivery?kind=shop"
            data-testid="shop-know"
            className="sr-only"
          >
            I know the shop — send a list
          </AppLink>
        </>
      ) : null}

      <p className="mt-8 pb-2 text-center text-[13px]">
        <AppLink
          href="/merchant/register"
          data-testid="shop-owner-kitchen"
          className="font-medium text-[#6B6B6B] underline-offset-2"
        >
          Are you a shop owner? Join Village Ride →
        </AppLink>
      </p>
    </div>
  );
}
