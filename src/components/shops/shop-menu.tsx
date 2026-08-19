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
  X,
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

function qtyFor(lines: CartLine[], productId: string) {
  return lines.find((l) => l.productId === productId)?.quantity ?? 0;
}

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
  const [justAdded, setJustAdded] = useState<string | null>(null);

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

  useEffect(() => {
    if (!justAdded) return;
    const t = window.setTimeout(() => setJustAdded(null), 220);
    return () => window.clearTimeout(t);
  }, [justAdded]);

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
    setJustAdded(product.id);
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
      <div className="flex min-h-dvh touch-manipulation flex-col bg-[#f2f2f2] px-4 pb-28 pt-8 font-[family-name:var(--font-display)] tracking-[-0.02em]">
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-[#06c167]" />
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
            className="uber-press uber-btn-black mt-8 w-full"
          >
            Back to shops
          </button>
          <Link
            href="/activity"
            className="uber-press mt-3 rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            View activity
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh touch-manipulation bg-[#f2f2f2] pb-28 font-[family-name:var(--font-display)] tracking-[-0.02em]">
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
          className="uber-press absolute top-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 active:bg-gray-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="mx-auto max-w-md px-4 -mt-6">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03]">
          <h1 className="text-2xl font-bold tracking-tight">{shop.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {shop.description || shop.notes || shop.category}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            20–30 min · {shop.landmark}
          </p>
        </div>

        <h2 className="mt-6 text-lg font-bold">Featured items</h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {products.map((product) => {
            const qty = qtyFor(shopLines, product.id);
            const popped = justAdded === product.id;
            return (
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
                  <div
                    className={`absolute right-1.5 bottom-1.5 transition-transform duration-150 ease-out ${
                      popped ? "scale-110" : "scale-100"
                    }`}
                  >
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAdd(product)}
                        className="uber-press uber-add-chip"
                        aria-label={`Add ${product.name}`}
                      >
                        Add
                      </button>
                    ) : (
                      <div className="uber-qty-stepper">
                        <button
                          type="button"
                          className="uber-press"
                          aria-label="Decrease"
                          onClick={() => setLineQty(product.id, qty - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          className="uber-press"
                          aria-label="Increase"
                          onClick={() => onAdd(product)}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {count > 0 && !sheetOpen && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="uber-press uber-btn-black uber-cart-enter flex w-full max-w-md items-center justify-between !rounded-full px-5"
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-2 text-xs font-bold">
                {count}
              </span>
              View cart
            </span>
            <span className="font-bold">{formatMoney(subtotal)}</span>
          </button>
        </div>
      )}

      {sheetOpen && (
        <div className="uber-sheet-scrim fixed inset-0 z-50 flex items-end justify-center bg-black/45">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close cart"
            onClick={() => setSheetOpen(false)}
          />
          <div className="uber-sheet-panel relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-white px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">Cart</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="uber-press flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="space-y-4">
              {shopLines.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{line.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatMoney(line.price * line.quantity)}
                    </p>
                  </div>
                  <div className="uber-qty-stepper">
                    <button
                      type="button"
                      className="uber-press"
                      onClick={() =>
                        setLineQty(line.productId, line.quantity - 1)
                      }
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      className="uber-press"
                      onClick={() =>
                        setLineQty(line.productId, line.quantity + 1)
                      }
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2.5 rounded-2xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery fee</span>
                <span className="font-semibold">
                  {formatMoney(SHOP_DELIVERY_FEE)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2.5 text-base font-bold">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-transparent bg-gray-100 px-4 py-3.5 text-sm outline-none transition focus:border-gray-300 focus:bg-white"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                inputMode="tel"
                className="w-full rounded-2xl border border-transparent bg-gray-100 px-4 py-3.5 text-sm outline-none transition focus:border-gray-300 focus:bg-white"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Delivery address / landmark"
                className="w-full rounded-2xl border border-transparent bg-gray-100 px-4 py-3.5 text-sm outline-none transition focus:border-gray-300 focus:bg-white"
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <button
              type="button"
              disabled={pending || shopLines.length === 0}
              onClick={placeOrder}
              className="uber-press uber-btn-black mt-5 w-full"
            >
              {pending
                ? "Placing order…"
                : `Place order · ${formatMoney(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
