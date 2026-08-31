"use client";

import { RIDER_SHOP_TRACK, riderShopTrackIndex } from "@/lib/shop-delivery";
import { formatMoney } from "@/lib/format";
import type { ShopOrder } from "@/lib/types";

export function ShopOrderTrack({ order }: { order: ShopOrder }) {
  const step = riderShopTrackIndex(order);
  const items =
    order.items
      ?.map((i) => `${i.quantity}× ${i.product_name}`)
      .join(", ") || "Shop order";

  return (
    <article
      data-testid="shop-order-track"
      className="rounded-[20px] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <p className="text-[12px] font-bold uppercase tracking-wide text-[#06c167]">
        Shop order {order.reference_code}
      </p>
      <p className="mt-1 text-[16px] font-bold text-[#111111]">{items}</p>
      <p className="mt-0.5 text-sm text-[#6B6B6B]">{order.delivery_address}</p>
      <p className="mt-1 text-[15px] font-bold">{formatMoney(order.total_amount)}</p>
      <ol className="mt-4 space-y-2">
        {RIDER_SHOP_TRACK.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                i <= step
                  ? "bg-[#06c167] text-white"
                  : "bg-[#EEEEEE] text-[#8A8A8A]"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-[14px] ${
                i <= step ? "font-bold text-black" : "text-[#8A8A8A]"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
