"use client";

import Link from "next/link";
import { Clock, Star, Store } from "lucide-react";
import type { Shop } from "@/lib/types";
import { UBER_GLOSS, UBER_H1, UBER_SUB } from "@/components/customer/uber-chrome";

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
        <h1 className={UBER_H1}>Shops near you</h1>
        <p className={UBER_SUB}>
          Order from local kitchens &amp; stores — delivered to your door.
        </p>
      </header>

      {shops.length === 0 ? (
        <div className={`rounded-[28px] px-4 py-10 text-center ${UBER_GLOSS}`}>
          <Store className="mx-auto h-8 w-8 text-[#6b6b6b]" />
          <p className="mt-3 text-[15px] font-bold text-[#0a0a0a]">
            No shops nearby yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shops.map((shop, i) => (
            <Link
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
