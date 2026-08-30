"use client";

import { useMemo, useState } from "react";
import { AppLink } from "@/components/ui/app-link";
import { Search, Star } from "lucide-react";
import type { Shop } from "@/lib/types";
import { SHOP_DELIVERY_FEE, SHOP_MIN_ORDER } from "@/lib/shop-constants";
import {
  SHOP_CATEGORY_PILLS,
  etaForShop,
  shopBannerSrc,
  shopPillMatch,
} from "@/lib/shop-photos";
import { ShopPhoto } from "@/components/shops/shop-photo";
import { formatMoney } from "@/lib/format";
import { ShopsHowItWorks } from "@/components/shops/shops-how-it-works";

export function ShopStorefront({ shops }: { shops: Shop[] }) {
  const [q, setQ] = useState("");
  const [pill, setPill] = useState<(typeof SHOP_CATEGORY_PILLS)[number]>("All");

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
    <div className="vr-page-enter touch-manipulation space-y-4">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.4px] text-black">
          Shops
        </h1>
        <p className="mt-1 text-[14px] leading-snug text-[#6B6B6B]">
          Browse, add to cart, pay in-app or cash. Delivery{" "}
          {formatMoney(SHOP_DELIVERY_FEE)}. Not listed? Use Fetch.
        </p>
        <AppLink
          href="/merchant/dashboard"
          data-testid="shop-owner-kitchen"
          className="uber-press mt-3 flex min-h-11 items-center justify-between rounded-[16px] bg-black px-4 text-[13px] font-bold text-white"
        >
          I own a shop — open kitchen
          <span aria-hidden>→</span>
        </AppLink>
      </header>

      <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <Search className="h-5 w-5 shrink-0 text-[#8A8A8A]" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search shops or products…"
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#A6A6A6]"
          enterKeyHint="search"
        />
      </label>

      <div
        className="vr-hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
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
                  ? "bg-[#06c167] text-white"
                  : "border border-[#E8E8E8] bg-white text-black"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <ShopPhoto
            src="/shops/shop-food.jpg"
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="px-4 py-8 text-center">
            <p className="text-[16px] font-bold text-black">
              {shops.length === 0
                ? "No shops nearby yet"
                : "No shops match that search"}
            </p>
            <p className="mt-1 text-[13px] text-[#6B6B6B]">
              Send a list with Fetch — the driver shops for you.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <AppLink
                href="/delivery?kind=shop"
                className="uber-press inline-flex min-h-11 items-center rounded-full bg-black px-4 text-sm font-bold text-white"
              >
                I know the shop — send a list
              </AppLink>
              <AppLink
                href="/merchant/register"
                className="uber-press inline-flex min-h-11 items-center text-sm font-bold text-black underline"
              >
                I own a shop — list it here
              </AppLink>
            </div>
          </div>
        </div>
      ) : (
        <div id="find-shop" className="grid scroll-mt-20 grid-cols-2 gap-3">
          {filtered.map((shop) => (
            <AppLink
              key={shop.id}
              href={`/shops/${shop.id}`}
              className="uber-press group block overflow-hidden rounded-[16px] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-[#F3E6D8]">
                <ShopPhoto
                  src={shopBannerSrc(shop)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-200 group-active:scale-[1.03]"
                />
                <span className="absolute top-2 left-2 rounded-full bg-[#06c167] px-2 py-0.5 text-[10px] font-bold text-white">
                  Open now
                </span>
              </div>
              <div className="space-y-1 p-2.5">
                <p className="line-clamp-2 text-[14px] font-bold leading-snug text-black">
                  {shop.name}
                </p>
                <p className="flex items-center gap-1 text-[12px] font-semibold text-[#3D3D3D]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {shop.rating_avg != null
                    ? shop.rating_avg.toFixed(1)
                    : "New"}
                  {shop.rating_count ? (
                    <span className="font-medium text-[#8A8A8A]">
                      ({shop.rating_count})
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] font-medium text-[#6B6B6B]">
                  {etaForShop(shop)} · {formatMoney(SHOP_DELIVERY_FEE)}
                </p>
                <p className="text-[11px] text-[#8A8A8A]">
                  Min. {formatMoney(SHOP_MIN_ORDER)}
                </p>
              </div>
            </AppLink>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <AppLink
          href="/delivery?kind=shop"
          data-testid="shop-know"
          className="uber-press rounded-[16px] bg-[#FFF8F0] px-3 py-3 text-[12px] font-bold text-[#9A5B12]"
        >
          I know the shop — send a list
        </AppLink>
        <a
          href="#find-shop"
          data-testid="shop-find"
          className="uber-press rounded-[16px] bg-white px-3 py-3 text-[12px] font-bold text-black ring-1 ring-black/[0.06]"
        >
          Find a shop for me
        </a>
      </div>

      <ShopsHowItWorks />
    </div>
  );
}
