"use client";

import Link from "next/link";
import { Clock, Star, Store } from "lucide-react";
import type { Shop } from "@/lib/types";

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
        <h1 className="text-3xl font-bold tracking-tight text-black">
          Shops near you
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Order from local kitchens &amp; stores — delivered to your door.
        </p>
      </header>

      {shops.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-10 text-center">
          <Store className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-3 text-sm font-medium text-gray-700">
            No shops nearby yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shops.map((shop, i) => (
            <Link
              key={shop.id}
              href={`/shops/${shop.id}`}
              className="uber-press group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md active:bg-gray-50"
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
                <p className="line-clamp-1 text-sm font-semibold text-black">
                  {shop.name}
                </p>
                <p className="line-clamp-2 text-xs text-gray-500">
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
