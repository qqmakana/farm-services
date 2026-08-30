"use client";

import { useEffect, useMemo, useState } from "react";
import { listShops } from "@/lib/actions";
import { matchListedShop } from "@/lib/shop-match";
import type { Shop } from "@/lib/types";

/** Fetch → Shops: if they type a listed name, send them to pay in-app. */
export function ListedShopCrossSell({ queries }: { queries: string[] }) {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    void listShops()
      .then(setShops)
      .catch(() => null);
  }, []);

  const match = useMemo(
    () => matchListedShop(shops, queries),
    [shops, queries],
  );

  if (match) {
    return (
      <a
        href={`/shops/${match.id}`}
        data-testid="listed-shop-cross-sell"
        className="block rounded-2xl bg-[#F3F3F3] px-4 py-3 text-center text-[13px] font-bold text-black"
      >
        {match.name} is on Village Ride — browse and pay in-app.
      </a>
    );
  }

  return (
    <a
      href="/shops"
      className="block text-center text-[13px] font-bold text-black underline underline-offset-2"
    >
      Shop is listed? Browse and pay in-app
    </a>
  );
}
