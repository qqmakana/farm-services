/** Client-side cart for Uber Eats-style shop orders. */

import { SHOP_DELIVERY_FEE } from "@/lib/shop-constants";

export { SHOP_DELIVERY_FEE };

export type CartLine = {
  productId: string;
  shopId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

type CartBlob = { shopId: string | null; lines: CartLine[] };

const KEY = "vr_shop_cart_v1";

function read(): CartBlob {
  if (typeof window === "undefined") return { shopId: null, lines: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { shopId: null, lines: [] };
    return JSON.parse(raw) as CartBlob;
  } catch {
    return { shopId: null, lines: [] };
  }
}

function write(blob: CartBlob) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(blob));
  window.dispatchEvent(new Event("vr-cart"));
}

export function getCart(): CartBlob {
  return read();
}

export function clearCart() {
  write({ shopId: null, lines: [] });
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.price * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

export function addToCart(line: Omit<CartLine, "quantity"> & { quantity?: number }) {
  const cart = read();
  if (cart.shopId && cart.shopId !== line.shopId) {
    // One shop at a time (Uber Eats style)
    cart.lines = [];
  }
  cart.shopId = line.shopId;
  const qty = line.quantity ?? 1;
  const existing = cart.lines.find((l) => l.productId === line.productId);
  if (existing) existing.quantity += qty;
  else {
    cart.lines.push({
      productId: line.productId,
      shopId: line.shopId,
      name: line.name,
      price: line.price,
      quantity: qty,
      imageUrl: line.imageUrl ?? null,
    });
  }
  write(cart);
  return cart;
}

export function setLineQty(productId: string, quantity: number) {
  const cart = read();
  if (quantity <= 0) {
    cart.lines = cart.lines.filter((l) => l.productId !== productId);
  } else {
    const line = cart.lines.find((l) => l.productId === productId);
    if (line) line.quantity = quantity;
  }
  if (cart.lines.length === 0) cart.shopId = null;
  write(cart);
  return cart;
}

export function subscribeCart(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("vr-cart", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("vr-cart", handler);
    window.removeEventListener("storage", handler);
  };
}
