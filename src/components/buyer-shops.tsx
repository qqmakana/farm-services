"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  PaymentSelector,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-selector";
import { FareBreakdownCard } from "@/components/uber/fare-breakdown-card";
import { PayPalCheckout } from "@/components/paypal-checkout";
import { useCountry } from "@/components/country/country-provider";
import {
  capturePayPalAndCreateShopOrder,
  createCashShopOrder,
  createLocalPaidShopOrder,
  createPayPalOrderAction,
  quoteFareAction,
} from "@/lib/actions";
import type { FareBreakdown } from "@/lib/fares";
import { formatMoney, VEHICLE_LABELS } from "@/lib/format";
import { stashPaypalApproveUrl, stashPaypalBooking } from "@/lib/paypal-draft";
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
  const { country, countryCode } = useCountry();
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [productId, setProductId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [landmark, setLandmark] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<FareBreakdown | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [payMethod, setPayMethod] = useState<CheckoutPaymentChoice>("cash");
  const [pending, startTransition] = useTransition();

  const shopProducts = useMemo(
    () => products.filter((p) => p.shop_id === shopId),
    [products, shopId],
  );

  const selected = shopProducts.find((p) => p.id === productId);
  const shop = shops.find((s) => s.id === shopId);
  const vehicle: VehicleType | null = selected
    ? suggestVehicle({
        service_type: "delivery",
        shop_catalog: true,
      })
    : null;

  useEffect(() => {
    if (!vehicle || !shop) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    void (async () => {
      try {
        const fare = await quoteFareAction({
          vehicle,
          service_type: "delivery",
          country_code: countryCode,
          pickup_lat: shop.lat,
          pickup_lng: shop.lng,
          dropoff_lat: null,
          dropoff_lng: null,
          customer_phone: buyerPhone.trim() || null,
        });
        if (!cancelled) setQuote(fare);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicle, shop, countryCode, buyerPhone]);

  const formReady =
    Boolean(shopId) &&
    Boolean(productId) &&
    Boolean(buyerName.trim()) &&
    Boolean(buyerPhone.trim()) &&
    Boolean(landmark.trim()) &&
    quote != null &&
    quote.fee_amount > 0;

  const orderDraft = () => ({
    shop_id: shopId,
    product_id: productId,
    buyer_name: buyerName.trim(),
    buyer_phone: buyerPhone.trim(),
    dropoff_landmark: landmark.trim(),
    dropoff_lat: null as number | null,
    dropoff_lng: null as number | null,
  });

  function bookCash() {
    setError(null);
    if (!formReady) {
      setError("Complete the form first.");
      return;
    }
    startTransition(async () => {
      try {
        const job = await createCashShopOrder(orderDraft());
        router.push(`/trip/${job.reference_code}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Booking failed");
      }
    });
  }

  if (shops.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
        No shops yet. Register one under Merchant.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[var(--ru-ink)]">
          Shop
          <select
            className="ru-soft-field mt-1.5 text-sm"
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
        <label className="block text-sm font-semibold text-[var(--ru-ink)]">
          Product
          <select
            required
            className="ru-soft-field mt-1.5 text-sm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select…</option>
            {shopProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatMoney(Number(p.price), country.currency, countryCode)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selected && vehicle ? (
        <p className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-[var(--ru-ink)]">
          Delivery vehicle: <strong>{VEHICLE_LABELS[vehicle]}</strong>
          {quoting ? " · quoting…" : null}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[var(--ru-ink)]">
          Your name
          <input
            required
            className="ru-soft-field mt-1.5 text-sm"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--ru-ink)]">
          Phone
          <input
            required
            className="ru-soft-field mt-1.5 text-sm"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-[var(--ru-ink)]">
        Deliver to landmark <span className="text-rose-600">*</span>
        <textarea
          required
          rows={2}
          className="ru-soft-field mt-1.5 text-sm"
          placeholder="White house opposite clinic, green gate"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
        />
      </label>

      {quote ? (
        <FareBreakdownCard
          baseFare={quote.base_fee_amount}
          distanceFare={quote.distance_fare + quote.night_surcharge_amount}
          platformFee={quote.platform_commission || quote.booking_fee}
          total={quote.fee_amount}
          currency={quote.currency}
          villagePass={quote.village_pass}
          distanceKm={quote.distance_km}
        />
      ) : null}

      <PaymentSelector
        value={payMethod}
        onChange={setPayMethod}
        currencyLabel={country.currencySymbol}
      />

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-1 space-y-2 border-t border-gray-100 bg-white pt-3 pb-1">
        {payMethod === "cash" ? (
          <button
            type="button"
            data-testid="book-button"
            disabled={!formReady || pending}
            onClick={bookCash}
            className="ru-btn-book ru-btn-block"
          >
            {pending ? "Booking…" : "Book Now"}
          </button>
        ) : (
          <PayPalCheckout
            amount={quote?.fee_amount ?? 0}
            description="Shop delivery · Village Ride"
            disabled={!formReady}
            submitLabel="Book Now"
            onCreateOrder={async () => {
              setError(null);
              if (!formReady || !vehicle) {
                throw new Error("Complete the form first.");
              }
              const d = orderDraft();
              stashPaypalBooking(d, "shop");
              const { orderId, approveUrl } = await createPayPalOrderAction({
                vehicle,
                service_type: "delivery",
                country_code: countryCode,
                customer_phone: buyerPhone.trim(),
                pickup_lat: shop?.lat ?? null,
                pickup_lng: shop?.lng ?? null,
                description: `Delivery · ${selected?.name ?? "shop order"}`,
              });
              stashPaypalApproveUrl(approveUrl);
              return { orderId, approveUrl };
            }}
            onApprove={async (orderId) => {
              setError(null);
              try {
                const job = await capturePayPalAndCreateShopOrder(
                  orderId,
                  orderDraft(),
                );
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
              const job = await createLocalPaidShopOrder(orderDraft());
              router.push(`/trip/${job.reference_code}`);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
