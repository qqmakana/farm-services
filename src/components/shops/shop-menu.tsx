"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react";
import {
  addToCart,
  cartCount,
  cartSubtotal,
  clearCart,
  getCart,
  setLineQty,
  SHOP_DELIVERY_FEE,
  subscribeCart,
  type CartLine,
} from "@/lib/shop-cart";
import { placeShopCartOrder } from "@/lib/actions-shop-orders";
import { formatMoney } from "@/lib/format";
import type { Product, Shop } from "@/lib/types";

export function ShopMenu({
  shop,
  products,
}: {
  shop: Shop;
  products: Product[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const sync = () => {
      const cart = getCart();
      setLines(
        cart.shopId === shop.id || !cart.shopId
          ? cart.lines.filter((l) => l.shopId === shop.id)
          : [],
      );
    };
    sync();
    return subscribeCart(sync);
  }, [shop.id]);

  const shopLines = lines.filter((l) => l.shopId === shop.id);
  const count = cartCount(shopLines);
  const subtotal = cartSubtotal(shopLines);
  const total = subtotal + SHOP_DELIVERY_FEE;

  function onAdd(product: Product) {
    addToCart({
      productId: product.id,
      shopId: shop.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url,
    });
  }

  function placeOrder() {
    setError(null);
    startTransition(async () => {
      try {
        const order = await placeShopCartOrder({
          shop_id: shop.id,
          customer_name: name,
          customer_phone: phone,
          delivery_address: address,
          items: shopLines.map((l) => ({
            product_id: l.productId,
            quantity: l.quantity,
          })),
          payment_method: "cash",
        });
        clearCart();
        setSheetOpen(false);
        setSuccess(order.reference_code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not place order");
      }
    });
  }

  if (success) {
    return (
      <div className="flex min-h-dvh flex-col bg-white px-4 pb-28 pt-8">
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Order placed!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            The shop is preparing your food. Reference{" "}
            <span className="font-semibold text-black">{success}</span>.
          </p>
          <button
            type="button"
            onClick={() => router.push("/shops")}
            className="mt-8 w-full rounded-2xl bg-black py-3.5 text-sm font-semibold text-white active:scale-[0.98] touch-manipulation"
          >
            Back to shops
          </button>
          <Link
            href="/activity"
            className="mt-3 text-sm font-medium text-gray-600 underline"
          >
            View activity
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-white pb-28">
      <div className="relative h-44 bg-gradient-to-br from-emerald-800 to-emerald-500">
        {shop.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-end p-5">
            <Store className="h-12 w-12 text-white/70" />
          </div>
        )}
        <Link
          href="/shops"
          className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md active:scale-95 touch-manipulation"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="mx-auto max-w-md px-4 -mt-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">{shop.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {shop.description || shop.notes || shop.category}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            20–30 min · {shop.landmark}
          </p>
        </div>

        <h2 className="mt-6 text-lg font-bold">Menu</h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {products.map((product) => (
            <li key={product.id} className="flex gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-black">{product.name}</p>
                {product.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                    {product.description}
                  </p>
                )}
                <p className="mt-2 text-sm font-semibold">
                  {formatMoney(Number(product.price))}
                </p>
              </div>
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onAdd(product)}
                  className="absolute right-1.5 bottom-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-green-600 shadow-md active:scale-95 touch-manipulation"
                >
                  Add
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {count > 0 && !sheetOpen && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full max-w-md items-center justify-between rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white shadow-lg active:scale-[0.99] touch-manipulation"
          >
            <span className="inline-flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
                {count}
              </span>
              View cart
            </span>
            <span>{formatMoney(subtotal)}</span>
          </button>
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close cart"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-4 pt-4 pb-8 shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
            <h3 className="text-xl font-bold">Your cart</h3>
            <ul className="mt-4 space-y-3">
              {shopLines.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{line.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatMoney(line.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:scale-95"
                      onClick={() =>
                        setLineQty(line.productId, line.quantity - 1)
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:scale-95"
                      onClick={() =>
                        setLineQty(line.productId, line.quantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 rounded-2xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery fee</span>
                <span className="font-medium">
                  {formatMoney(SHOP_DELIVERY_FEE)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-300"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                inputMode="tel"
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-300"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Delivery address / landmark"
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-300"
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <button
              type="button"
              disabled={pending || shopLines.length === 0}
              onClick={placeOrder}
              className="mt-5 w-full rounded-2xl bg-black py-3.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] touch-manipulation"
            >
              {pending ? "Placing order…" : `Place order · ${formatMoney(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
