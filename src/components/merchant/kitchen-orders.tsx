"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle, Clock, CookingPot } from "lucide-react";
import { updateShopOrderStatus } from "@/lib/actions-shop-orders";
import { formatMoney, formatWhen } from "@/lib/format";
import type { ShopOrder, ShopOrderStatus } from "@/lib/types";

function statusStyle(status: ShopOrderStatus) {
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "preparing") return "bg-blue-100 text-blue-800";
  if (status === "ready") return "bg-emerald-100 text-emerald-800";
  if (status === "cancelled") return "bg-gray-100 text-gray-600";
  return "bg-gray-100 text-gray-700";
}

function statusLabel(status: ShopOrderStatus) {
  if (status === "pending") return "Pending";
  if (status === "preparing") return "Preparing";
  if (status === "ready") return "Ready";
  if (status === "out_for_delivery") return "Out for delivery";
  if (status === "delivered") return "Delivered";
  return "Cancelled";
}

export function KitchenOrders({ orders }: { orders: ShopOrder[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setStatus(orderId: string, status: ShopOrderStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateShopOrderStatus(orderId, status);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <section className="mt-8 touch-manipulation">
      <div className="flex items-center gap-2">
        <CookingPot className="h-5 w-5 text-black" />
        <h2 className="text-lg font-bold tracking-tight">Kitchen orders</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Incoming storefront orders. Mark Ready — the nearest online driver
        gets a collect-and-deliver offer.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No storefront orders yet. When riders order from your menu, they
          appear here.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => {
            const itemsLabel =
              order.items
                ?.map((i) => `${i.quantity}x ${i.product_name}`)
                .join(", ") || "Items";
            return (
              <li
                key={order.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">Order {order.reference_code}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatWhen(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-700">{itemsLabel}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {order.customer_name} · {order.delivery_address}
                </p>
                <p className="mt-2 text-base font-bold">
                  {formatMoney(order.total_amount)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setStatus(order.id, "preparing")}
                      className="uber-press uber-btn-black !min-h-10 !px-4 !text-sm"
                    >
                      Start preparing
                    </button>
                  )}
                  {(order.status === "pending" ||
                    order.status === "preparing") && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setStatus(order.id, "ready")}
                      className="uber-press inline-flex min-h-10 items-center gap-1 rounded-full bg-[#06c167] px-4 text-sm font-bold text-white hover:bg-[#05a85a] active:bg-[#048a4a]"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Ready for pickup
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
