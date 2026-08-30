"use server";

import { revalidatePath } from "next/cache";
import { mockRepo } from "@/lib/mock-store";
import { SHOP_DELIVERY_FEE, SHOP_MIN_ORDER } from "@/lib/shop-constants";
import {
  isYocoConfigured,
  looksLikeYocoCheckoutId,
  yocoConfirmPaid,
} from "@/lib/yoco";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  Product,
  Shop,
  ShopCartOrderInput,
  ShopOrder,
  ShopOrderItem,
  ShopOrderStatus,
} from "@/lib/types";
import { suggestVehicle } from "@/lib/vehicles";

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function refCode() {
  return `SO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function revalidateShopPaths(shopId?: string) {
  revalidatePath("/shops");
  if (shopId) revalidatePath(`/shops/${shopId}`);
  revalidatePath("/merchant/dashboard");
  revalidatePath("/activity");
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  if (!useAdmin()) {
    return mockRepo.listShops().find((s) => s.id === shopId) ?? null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_shops")
    .select("*")
    .eq("id", shopId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Shop | null) ?? null;
}

export async function placeShopCartOrder(
  input: ShopCartOrderInput,
): Promise<ShopOrder> {
  if (!input.shop_id) throw new Error("Shop is required.");
  if (!input.customer_name?.trim()) throw new Error("Your name is required.");
  if (!input.customer_phone?.trim()) throw new Error("Phone is required.");
  if (!input.delivery_address?.trim()) {
    throw new Error("Delivery address is required.");
  }
  if (!input.items?.length) throw new Error("Cart is empty.");

  const order = !useAdmin()
    ? mockRepo.placeShopCartOrder(input)
    : await placeShopCartOrderDb(input);

  revalidateShopPaths(input.shop_id);
  return order;
}

async function placeShopCartOrderDb(
  input: ShopCartOrderInput,
): Promise<ShopOrder> {
  const admin = createAdminClient();
  const { data: shop, error: shopErr } = await admin
    .from("rr_shops")
    .select("*")
    .eq("id", input.shop_id)
    .eq("is_active", true)
    .maybeSingle();
  if (shopErr) throw new Error(shopErr.message);
  if (!shop) throw new Error("Shop not found.");

  const productIds = input.items.map((i) => i.product_id);
  const { data: products, error: prodErr } = await admin
    .from("rr_products")
    .select("*")
    .eq("shop_id", input.shop_id)
    .eq("in_stock", true)
    .in("id", productIds);
  if (prodErr) throw new Error(prodErr.message);

  const byId = new Map((products as Product[]).map((p) => [p.id, p]));
  const lines: { product: Product; quantity: number }[] = [];
  for (const line of input.items) {
    const product = byId.get(line.product_id);
    if (!product) throw new Error("A product in your cart is unavailable.");
    if (line.quantity < 1) throw new Error("Invalid quantity.");
    lines.push({ product, quantity: Math.floor(line.quantity) });
  }

  const subtotal = lines.reduce(
    (s, l) => s + Number(l.product.price) * l.quantity,
    0,
  );
  if (subtotal < SHOP_MIN_ORDER) {
    throw new Error(
      `Add R${SHOP_MIN_ORDER - subtotal} more to checkout (minimum R${SHOP_MIN_ORDER}).`,
    );
  }
  const delivery_fee = SHOP_DELIVERY_FEE;
  const total_amount = subtotal + delivery_fee;
  const summary = lines
    .map((l) => `${l.quantity}x ${l.product.name}`)
    .join(", ");
  const maxSize = lines.reduce<"small" | "medium" | "large" | "xl">(
    (acc, l) => {
      const order = ["small", "medium", "large", "xl"] as const;
      return order.indexOf(l.product.size) > order.indexOf(acc)
        ? l.product.size
        : acc;
    },
    "small",
  );

  const required = suggestVehicle({
    service_type: "delivery",
    delivery_size: maxSize,
  });

  let jobId: string | null = null;
  try {
    const { createJob } = await import("@/lib/actions");
    const job = await createJob({
      service_type: "delivery",
      required_vehicle: required,
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      pickup_lat: shop.lat,
      pickup_lng: shop.lng,
      pickup_landmark: `${shop.name} — ${shop.landmark}`,
      dropoff_lat: input.delivery_lat ?? null,
      dropoff_lng: input.delivery_lng ?? null,
      dropoff_landmark: input.delivery_address.trim(),
      details: {
        item_description: summary,
        size: maxSize,
        needs_helpers: maxSize === "large" || maxSize === "xl",
      },
      fee_amount: delivery_fee,
      shop_id: shop.id,
      product_summary: `${summary} · goods ${subtotal}`,
      dispatcher_notes: `Eats order from ${shop.name} — goods R${subtotal} + delivery R${delivery_fee}`,
      payment: { method: "cash" },
    });
    jobId = job.id;
  } catch {
    /* Shop order still saved if dispatch job fails */
  }

  const now = new Date().toISOString();
  const { data: orderRow, error: orderErr } = await admin
    .from("rr_shop_orders")
    .insert({
      reference_code: refCode(),
      shop_id: shop.id,
      job_id: jobId,
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      delivery_address: input.delivery_address.trim(),
      delivery_lat: input.delivery_lat ?? null,
      delivery_lng: input.delivery_lng ?? null,
      status: "pending",
      subtotal,
      delivery_fee,
      total_amount,
      payment_method: input.payment_method ?? "cash",
      notes: input.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (orderErr) {
    // Table may not exist yet — fall back to mock for local/demo
    if (
      /rr_shop_orders|does not exist|schema cache/i.test(orderErr.message)
    ) {
      return mockRepo.placeShopCartOrder(input);
    }
    throw new Error(orderErr.message);
  }

  const order = orderRow as ShopOrder;
  const itemRows = lines.map((l) => ({
    order_id: order.id,
    product_id: l.product.id,
    product_name: l.product.name,
    quantity: l.quantity,
    price_at_purchase: Number(l.product.price),
  }));

  const { data: items, error: itemsErr } = await admin
    .from("rr_shop_order_items")
    .insert(itemRows)
    .select("*");
  if (itemsErr) throw new Error(itemsErr.message);

  return { ...order, items: (items as ShopOrderItem[]) ?? [] };
}

export async function listShopOrdersForShop(
  shopId: string,
): Promise<ShopOrder[]> {
  if (!useAdmin()) return mockRepo.listShopOrders(shopId);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_shop_orders")
    .select("*, items:rr_shop_order_items(*)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    if (/rr_shop_orders|does not exist|schema cache/i.test(error.message)) {
      return mockRepo.listShopOrders(shopId);
    }
    throw new Error(error.message);
  }

  return ((data ?? []) as ShopOrder[]).map((o) => ({
    ...o,
    items: o.items ?? [],
  }));
}

export async function updateShopOrderStatus(
  orderId: string,
  status: ShopOrderStatus,
): Promise<ShopOrder> {
  const allowed: ShopOrderStatus[] = [
    "pending",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];
  if (!allowed.includes(status)) throw new Error("Invalid status.");

  if (!useAdmin()) {
    const order = mockRepo.updateShopOrderStatus(orderId, status);
    revalidateShopPaths(order.shop_id);
    return order;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_shop_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*, items:rr_shop_order_items(*)")
    .single();

  if (error) {
    if (/rr_shop_orders|does not exist|schema cache/i.test(error.message)) {
      const order = mockRepo.updateShopOrderStatus(orderId, status);
      revalidateShopPaths(order.shop_id);
      return order;
    }
    throw new Error(error.message);
  }

  const order = data as ShopOrder;
  revalidateShopPaths(order.shop_id);
  return order;
}

export async function captureYocoAndPlaceShopCart(
  checkoutId: string,
  input: Omit<ShopCartOrderInput, "payment_method">,
) {
  if (!isYocoConfigured() && !looksLikeYocoCheckoutId(checkoutId)) {
    throw new Error("Card payment is not configured.");
  }
  await yocoConfirmPaid(checkoutId);
  return placeShopCartOrder({
    ...input,
    payment_method: "card",
    notes: `yoco:${checkoutId}`,
  });
}
