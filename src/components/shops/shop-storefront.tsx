"use client";

import { AppLink } from "@/components/ui/app-link";
import { Clock, Star, Store } from "lucide-react";
import type { Shop } from "@/lib/types";
import { SERVICE_COPY } from "@/lib/service-guide";
import { UBER_GLOSS, UBER_H1, UBER_SUB } from "@/components/customer/uber-chrome";
import { ShopsHowItWorks } from "@/components/shops/shops-how-it-works";

const ACCENTS = [
  "from-emerald-700 to-emerald-500",
  "from-amber-700 to-orange-500",
  "from-slate-700 to-slate-500",
  "from-rose-700 to-rose-500",
];

function etaFor(shop: Shop) {
  if (shop.category === "food" || shop.category === "groceries") return "20–30 min";
  return "45–90 min";
}

export function ShopStorefront({ shops }: { shops: Shop[] }) {
  return (
    <div className="touch-manipulation space-y-5">
      <header>
        <h1 className={UBER_H1}>Shops</h1>
        <p className={UBER_SUB}>
          Order from local shops. You pay for the goods. Village Ride only
          charges delivery — cash or PayPal.
        </p>
      </header>

      <ShopsHowItWorks />

      <div className="grid grid-cols-1 gap-3">
        <AppLink
          href="/delivery?kind=shop"
          data-testid="shop-know"
          className={`uber-press rounded-[28px] p-4 ${UBER_GLOSS}`}
        >
          <p className="text-[15px] font-bold text-[#0a0a0a]">
            I know the shop
          </p>
          <p className="mt-1 text-[13px] font-medium text-[#6b6b6b]">
            Shop & Deliver — send a list and the shop name. Pay for groceries
            at the till. Village Ride charges the delivery fee only.
          </p>
        </AppLink>
        <a
          href="#find-shop"
          data-testid="shop-find"
          className={`uber-press rounded-[28px] p-4 ${UBER_GLOSS}`}
        >
          <p className="text-[15px] font-bold text-[#0a0a0a]">
            Find a shop for me
          </p>
          <p className="mt-1 text-[13px] font-medium text-[#6b6b6b]">
            {SERVICE_COPY.restaurantPickup.blurb}
          </p>
        </a>
      </div>

      <h2 id="find-shop" className="scroll-mt-24 text-[17px] font-bold text-[#0a0a0a]">
        Menus near you
      </h2>

      {shops.length === 0 ? (
        <div className={`rounded-[28px] px-4 py-10 text-center ${UBER_GLOSS}`}>
          <Store className="mx-auto h-8 w-8 text-[#6b6b6b]" />
          <p className="mt-3 text-[15px] font-bold text-[#0a0a0a]">
            No shops nearby yet
          </p>
          <AppLink
            href="/delivery?kind=shop"
            className="uber-press mt-4 inline-flex min-h-11 items-center rounded-full bg-black px-4 text-sm font-bold text-white"
          >
            I know the shop — send a list
          </AppLink>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shops.map((shop, i) => (
            <AppLink
              key={shop.id}
              href={`/shops/${shop.id}`}
              className={`uber-press group overflow-hidden rounded-[28px] ${UBER_GLOSS}`}
            >
              <div
                className={`relative h-32 bg-gradient-to-br ${ACCENTS[i % ACCENTS.length]}`}
              >
                {shop.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shop.image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-150 group-active:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-end p-3">
                    <Store className="h-8 w-8 text-white/80" />
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-[15px] font-bold text-[#0a0a0a]">
                  {shop.name}
                </p>
                <p className="line-clamp-2 text-[13px] font-medium text-[#6b6b6b]">
                  {shop.description || shop.notes || shop.category}
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {etaFor(shop)}
                  </span>
                  {shop.rating_avg != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {shop.rating_avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </AppLink>
          ))}
        </div>
      )}
    </div>
  );
}
