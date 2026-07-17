"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PayPalCheckout } from "@/components/paypal-checkout";
import {
  capturePayPalAndCreateShopOrder,
  createLocalPaidShopOrder,
  createPayPalOrderAction,
  quoteFareAction,
} from "@/lib/actions";
import { formatMoney, VEHICLE_LABELS } from "@/lib/format";
import type { Product, Shop, VehicleType } from "@/lib/types";
import { suggestVehicle } from "@/lib/vehicles";

export function BuyerShops({
  shops,
  products,
}: {
  shops: Shop[];
  products: Product[];
}) {
  const router = useRouter();
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [productId, setProductId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [landmark, setLandmark] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [quotedFee, setQuotedFee] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);

  const shopProducts = useMemo(
    () => products.filter((p) => p.shop_id === shopId),
    [products, shopId],
  );

  const selected = shopProducts.find((p) => p.id === productId);
  const shop = shops.find((s) => s.id === shopId);
  const vehicle: VehicleType | null = selected
    ? suggestVehicle({
        service_type: "delivery",
        delivery_size: selected.size,
      })
    : null;

  useEffect(() => {
    if (!vehicle || !shop) {
      setQuotedFee(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    void (async () => {
      try {
        const fare = await quoteFareAction({
          vehicle,
          pickup_lat: shop.lat,
          pickup_lng: shop.lng,
          dropoff_lat: null,
          dropoff_lng: null,
        });
        if (!cancelled) setQuotedFee(fare.fee_amount);
      } catch {
        if (!cancelled) setQuotedFee(null);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicle, shop]);

  const formReady =
    Boolean(shopId) &&
    Boolean(productId) &&
    Boolean(buyerName.trim()) &&
    Boolean(buyerPhone.trim()) &&
    Boolean(landmark.trim()) &&
    quotedFee != null &&
    quotedFee > 0;

  if (shops.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No shops yet. Register one under Merchant.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Shop</span>
          <select
            className="ru-input mt-1"
            value={shopId}
            onChange={(e) => {
              setShopId(e.target.value);
              setProductId("");
            }}
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Product</span>
          <select
            required
            className="ru-input mt-1"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select…</option>
            {shopProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatMoney(Number(p.price))}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selected && vehicle && (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-800">
          Delivery: <strong>{VEHICLE_LABELS[vehicle]}</strong> · fare{" "}
          {quoting
            ? "quoting…"
            : quotedFee != null
              ? formatMoney(quotedFee)
              : "—"}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Your name</span>
          <input
            required
            className="ru-input mt-1"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Phone</span>
          <input
            required
            className="ru-input mt-1"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium">
          Deliver to landmark <span className="text-rose-600">*</span>
        </span>
        <textarea
          required
          rows={2}
          className="ru-input mt-1"
          placeholder="White house opposite clinic, green gate"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
        />
      </label>

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      <PayPalCheckout
        amount={quotedFee ?? 0}
        description="Shop delivery · Village Ride"
        disabled={!formReady}
        onCreateOrder={async () => {
          setError(null);
          if (!formReady || !vehicle) throw new Error("Complete the form first.");
          const { orderId } = await createPayPalOrderAction({
            vehicle,
            pickup_lat: shop?.lat ?? null,
            pickup_lng: shop?.lng ?? null,
            description: `Delivery · ${selected?.name ?? "shop order"}`,
          });
          return orderId;
        }}
        onApprove={async (orderId) => {
          setError(null);
          try {
            const job = await capturePayPalAndCreateShopOrder(orderId, {
              shop_id: shopId,
              product_id: productId,
              buyer_name: buyerName.trim(),
              buyer_phone: buyerPhone.trim(),
              dropoff_landmark: landmark.trim(),
              dropoff_lat: null,
              dropoff_lng: null,
            });
            router.push(`/trip/${job.reference_code}`);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment failed");
            throw err;
          }
        }}
        onLocalPay={async () => {
          setError(null);
          if (!formReady) throw new Error("Complete the form first.");
          const job = await createLocalPaidShopOrder({
            shop_id: shopId,
            product_id: productId,
            buyer_name: buyerName.trim(),
            buyer_phone: buyerPhone.trim(),
            dropoff_landmark: landmark.trim(),
            dropoff_lat: null,
            dropoff_lng: null,
          });
          router.push(`/trip/${job.reference_code}`);
          router.refresh();
        }}
      />
    </div>
  );
}
