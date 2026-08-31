"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { AppLink } from "@/components/ui/app-link";
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
import { SHOP_MIN_ORDER } from "@/lib/shop-constants";
import { placeShopCartOrder } from "@/lib/actions-shop-orders";
import { createPayPalOrderAction } from "@/lib/actions";
import { PaymentSelector, type CheckoutPaymentChoice } from "@/components/checkout/payment-selector";
import { SafeCardPay } from "@/components/uber/safe-card-pay";
import { stashPaypalBooking } from "@/lib/paypal-draft";
import { formatMoney, formatPhoneDisplay } from "@/lib/format";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  etaForShop,
  productCategory,
  productPhotoSrc,
  shopCoverUrl,
} from "@/lib/shop-photos";
import { ShopPhoto } from "@/components/shops/shop-photo";
import type { Product, Shop } from "@/lib/types";

function qtyFor(lines: CartLine[], productId: string) {
  return lines.find((l) => l.productId === productId)?.quantity ?? 0;
}

const TRACK = [
  "Order placed",
  "Shop is packing",
  "Driver collecting",
  "On the way",
  "Delivered",
];

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
  const [payMethod, setPayMethod] = useState<CheckoutPaymentChoice>("cash");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>("Popular");

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
  const needMore = Math.max(0, SHOP_MIN_ORDER - subtotal);
  const popular = products.filter((p) => p.in_stock).slice(0, 4);
  const groups = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const cat = productCategory(p.name);
      const list = map.get(cat) ?? [];
      list.push(p);
      map.set(cat, list);
    }
    return [...map.entries()];
  }, [products]);
  const tabs = groups.length > 1 ? ["Popular", ...groups.map(([c]) => c)] : [];

  const cartDraft = () => ({
    shop_id: shop.id,
    customer_name: name,
    customer_phone: phone.replace(/\D/g, ""),
    delivery_address: address,
    items: shopLines.map((l) => ({
      product_id: l.productId,
      quantity: l.quantity,
    })),
  });

  function onAdd(product: Product) {
    if (!product.in_stock) return;
    addToCart({
      productId: product.id,
      shopId: shop.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: productPhotoSrc(product),
    });
    setJustAdded(product.id);
  }

  function scrollToCat(cat: string) {
    setActiveCat(cat);
    const el = document.getElementById(
      cat === "Popular" ? "shop-popular" : `shop-cat-${cat}`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function placeOrder() {
    setError(null);
    startTransition(async () => {
      try {
        const order = await placeShopCartOrder({
          shop_id: shop.id,
          customer_name: name,
          customer_phone: phone.replace(/\D/g, ""),
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
      <div className="vr-page-enter flex min-h-dvh touch-manipulation flex-col bg-[#F5F5F5] px-4 pb-28 pt-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[20px] bg-white px-4 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <p className="text-[13px] font-semibold text-[#06c167]">
              Order placed
            </p>
            {/* TODO: shop.name is from the shops table in Supabase. Rename there — not in code. */}
            <h1 className="mt-1 text-[24px] font-bold tracking-tight text-[#111111]">
              {shop.name} is packing
            </h1>
            <p className="mt-1 text-sm text-[#6B6B6B]">
              Reference <span className="font-bold text-black">{success}</span>
            </p>
            <ol className="mt-5 space-y-3">
              {TRACK.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                      i === 0
                        ? "bg-[#06c167] text-white"
                        : "bg-[#EEEEEE] text-[#8A8A8A]"
                    }`}
                  >
                    {i === 0 ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span
                    className={`text-[14px] ${
                      i === 0 ? "font-bold text-black" : "text-[#8A8A8A]"
                    }`}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={() => router.push("/activity")}
            className="uber-press uber-btn-black mt-5 w-full"
          >
            Track in Activity
          </button>
          <AppLink
            href="/shops"
            className="uber-press mt-3 block text-center text-sm font-bold text-[#6B6B6B]"
          >
            Back to shops
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="vr-page-enter relative min-h-dvh touch-manipulation bg-[#F5F5F5] pb-28">
      <div className="flex items-center justify-between bg-white px-3 py-2">
        <AppLink
          href="/shops"
          className="uber-press inline-flex min-h-11 items-center gap-1 text-[15px] font-bold text-[#111111]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
          Shops
        </AppLink>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="uber-press relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2 text-[15px] font-bold text-[#111111]"
          aria-label="Cart"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 ? (
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-[#06c167] px-1 text-[10px] font-bold text-white ${justAdded ? "vr-add-pop" : ""}`}
            >
              {count}
            </span>
          ) : (
            <span className="text-[13px] font-medium text-[#6B6B6B]">Cart</span>
          )}
        </button>
      </div>

      <div className="relative h-32 overflow-hidden bg-[#3d2a1a]">
        {shopCoverUrl(shop) ? (
          <ShopPhoto
            src={shopCoverUrl(shop)!}
            alt=""
            className="h-full w-full object-cover"
            fallback={null}
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(160deg,#2b2b2b_0%,#5a4636_55%,#8a6a4a_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute right-4 bottom-4 left-4 text-white">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.4px]">
            {/* TODO: shop.name is from the shops table in Supabase. Rename there — not in code. */}
            {shop.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] font-semibold text-white/90">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {shop.rating_avg != null ? shop.rating_avg.toFixed(1) : "New"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {etaForShop(shop)}
            </span>
            <span>{formatMoney(SHOP_DELIVERY_FEE)} delivery</span>
          </p>
        </div>
      </div>

      {tabs.length > 0 ? (
        <div
          className="vr-hide-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-[#E8E8E8] bg-white px-4 py-2.5"
          role="tablist"
          aria-label="Menu sections"
        >
          {tabs.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCat === cat}
              onClick={() => scrollToCat(cat)}
              className={`uber-press shrink-0 rounded-full px-3 py-1.5 text-[13px] font-bold ${
                activeCat === cat
                  ? "bg-black text-white"
                  : "bg-[#F3F3F3] text-[#3D3D3D]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mx-auto max-w-md space-y-6 px-4 pb-8 pt-5">
        {tabs.length > 0 && popular.length > 0 ? (
          <section id="shop-popular" className="scroll-mt-16 pt-5">
            <h2 className="text-[17px] font-bold text-[#111111]">Most ordered</h2>
            <div className="mt-3 space-y-3">
              {popular.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  qty={qtyFor(shopLines, product.id)}
                  popped={justAdded === product.id}
                  onAdd={() => onAdd(product)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {groups.map(([cat, items]) => (
          <section
            key={cat}
            id={`shop-cat-${cat}`}
            className="scroll-mt-16"
          >
            <h2 className="text-[17px] font-bold text-[#111111]">{cat}</h2>
            <div className="mt-3 space-y-3">
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  qty={qtyFor(shopLines, product.id)}
                  popped={justAdded === product.id}
                  onAdd={() => onAdd(product)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {count > 0 && !sheetOpen ? (
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
      ) : null}

      {sheetOpen ? (
        <div className="uber-sheet-scrim fixed inset-0 z-50 flex items-end justify-center bg-black/45">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close cart"
            onClick={() => setSheetOpen(false)}
          />
          <div className="uber-sheet-panel relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-white px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E0E0E0]" />
            {count === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Your cart is empty"
                body="Add items from a shop to get started"
                action={
                  <button
                    type="button"
                    className="uber-press uber-btn-black"
                    onClick={() => setSheetOpen(false)}
                  >
                    Browse shops
                  </button>
                }
              />
            ) : (
              <>
            <div className="mb-1 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Your order</h3>
                <p className="text-[13px] text-[#6B6B6B]">{shop.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="uber-press flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-3 space-y-3">
              {shopLines.map((line) => (
                <li key={line.productId} className="flex items-center gap-3">
                  <ShopPhoto
                    src={line.imageUrl || "/shops/prod-staples.jpg"}
                    alt=""
                    fallback="/shops/prod-staples.jpg"
                    className="h-14 w-14 rounded-[12px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{line.name}</p>
                    <p className="text-sm font-bold">
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

            <div className="mt-5 space-y-2.5 rounded-2xl bg-[#FFF8F0] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Subtotal</span>
                <span className="font-semibold">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Delivery</span>
                <span className="font-semibold">
                  {formatMoney(SHOP_DELIVERY_FEE)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#F0E0CC] pt-2.5 text-base font-bold">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 w-full rounded-[12px] border border-[#E0E0E0] bg-white px-4 text-[16px] outline-none focus:border-2 focus:border-[#111111]"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                placeholder="082 123 4567"
                inputMode="tel"
                autoComplete="tel"
                className="h-12 w-full rounded-[12px] border border-[#E0E0E0] bg-white px-4 text-[16px] outline-none focus:border-2 focus:border-[#111111]"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Delivery address / landmark"
                className="h-12 w-full rounded-[12px] border border-[#E0E0E0] bg-white px-4 text-[16px] outline-none focus:border-2 focus:border-[#111111]"
              />
            </div>

            {needMore > 0 ? (
              <p className="mt-3 text-sm font-semibold text-[#b45309]">
                Add {formatMoney(needMore)} more to checkout (minimum{" "}
                {formatMoney(SHOP_MIN_ORDER)}).
              </p>
            ) : null}

            <div className="mt-4">
              <PaymentSelector value={payMethod} onChange={setPayMethod} />
            </div>

            {error ? (
              <p className="mt-3 text-[12px] text-[#CB4040]">{error}</p>
            ) : null}

            {payMethod === "card" && needMore === 0 ? (
              <div className="mt-4">
                <SafeCardPay
                  amount={total}
                  description={`Village Ride shop · ${shop.name}`}
                  disabled={pending || shopLines.length === 0}
                  submitLabel="Pay with card"
                  onCreateOrder={async () => {
                    stashPaypalBooking(cartDraft(), "cart");
                    return createPayPalOrderAction({
                      amount: total,
                      description: `Village Ride · ${shop.name}`,
                    });
                  }}
                  onApprove={async () => undefined}
                />
              </div>
            ) : (
              <button
                type="button"
                disabled={pending || shopLines.length === 0 || needMore > 0}
                onClick={placeOrder}
                className="uber-press uber-btn-black mt-5 w-full"
              >
                {pending ? <ButtonSpinner /> : `Place order · ${formatMoney(total)}`}
              </button>
            )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function productBlurb(product: Product) {
  const d = product.description?.trim();
  if (d) return d;
  return productCategory(product.name);
}

function ProductCard({
  product,
  qty,
  popped,
  onAdd,
}: {
  product: Product;
  qty: number;
  popped: boolean;
  onAdd: () => void;
}) {
  const unit = Number(product.price);
  const lineTotal = unit * Math.max(qty, 1);

  return (
    <article
      className={`overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
        product.in_stock ? "" : "opacity-50"
      }`}
    >
      <ShopPhoto
        src={productPhotoSrc(product)}
        alt=""
        fallback="/shops/prod-staples.jpg"
        className={`h-44 w-full object-cover ${
          product.in_stock ? "" : "grayscale"
        }`}
      />
      <div className="p-3">
        <p className="text-[16px] font-bold leading-snug text-[#111111]">
          {product.name}
        </p>
        <p className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-[#666666]">
          {productBlurb(product)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <p className="vr-price">{formatMoney(lineTotal)}</p>
            {qty > 1 ? (
              <p className="text-[11px] font-medium text-[#8A8A8A]">
                {qty} × {formatMoney(unit)}
              </p>
            ) : null}
          </div>
          {product.in_stock ? (
            <AddControl
              product={product}
              qty={qty}
              popped={popped}
              onAdd={onAdd}
            />
          ) : (
            <p className="text-[12px] font-bold text-[#8A8A8A]">Unavailable</p>
          )}
        </div>
      </div>
    </article>
  );
}

function AddControl({
  product,
  qty,
  popped,
  onAdd,
}: {
  product: Product;
  qty: number;
  popped: boolean;
  onAdd: () => void;
}) {
  return (
    <div className={`shrink-0 ${popped ? "vr-add-pop" : ""}`}>
      {qty === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="uber-add-plus uber-press"
          aria-label={`Add ${product.name}`}
        >
          <span>
            <Plus className="h-4 w-4" strokeWidth={2.75} />
          </span>
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
            onClick={onAdd}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
