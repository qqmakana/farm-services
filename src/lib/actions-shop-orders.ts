"use server";

import { revalidatePath } from "next/cache";
import { mockRepo } from "@/lib/mock-store";
import {
  SHOP_DELIVERY_FEE,
  SHOP_DRIVER_COLLECT,
  SHOP_MIN_ORDER,
  SHOP_PLATFORM_DELIVERY,
} from "@/lib/shop-constants";
import { insertPaidJob } from "@/lib/matching";
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

  try {
    const { notifyShopNewCartOrder } = await import("@/lib/partner");
    await notifyShopNewCartOrder(order);
  } catch {
    /* order already placed */
  }

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
  const now = new Date().toISOString();
  const { data: orderRow, error: orderErr } = await admin
    .from("rr_shop_orders")
    .insert({
      reference_code: refCode(),
      shop_id: shop.id,
      job_id: null,
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

  let order = data as ShopOrder;
  if (status === "ready") {
    try {
      order = await dispatchShopDelivery(order);
    } catch {
      /* shop still marked ready */
    }
  }
  revalidateShopPaths(order.shop_id);
  return order;
}

async function dispatchShopDelivery(order: ShopOrder): Promise<ShopOrder> {
  if (order.job_id) return order;
  const admin = createAdminClient();
  const shop = await getShopById(order.shop_id);
  if (!shop) return order;

  const pickupLat = shop.lat ?? order.delivery_lat;
  const pickupLng = shop.lng ?? order.delivery_lng;
  const dropLat = order.delivery_lat ?? shop.lat;
  const dropLng = order.delivery_lng ?? shop.lng;
  if (pickupLat == null || pickupLng == null || dropLat == null || dropLng == null) {
    return order;
  }

  const yocoId = order.notes?.startsWith("yoco:")
    ? order.notes.slice(5)
    : `shop-${order.id}`;
  const card = order.payment_method === "card";
  const itemCount = (order.items ?? []).reduce(
    (s, i) => s + Math.max(0, Number(i.quantity) || 0),
    0,
  );
  const itemsLabel =
    itemCount > 0
      ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
      : "packed bag";

  const job = await insertPaidJob({
    status: "searching_driver",
    service_type: "delivery",
    required_vehicle: "sedan",
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    pickup_landmark: `${shop.name} — ${shop.landmark}`,
    dropoff_lat: dropLat,
    dropoff_lng: dropLng,
    dropoff_landmark: order.delivery_address,
    details: {
      item_description: `Package delivery — no passenger. Collect ${itemsLabel} from ${shop.name}.`,
      shop_name: shop.name,
      item_count: itemCount,
      size: "small",
      needs_helpers: false,
    },
    fee_amount: SHOP_DELIVERY_FEE,
    platform_commission: SHOP_PLATFORM_DELIVERY,
    driver_payout: SHOP_DRIVER_COLLECT,
    fee_currency: "ZAR",
    country_code: "ZA",
    payment_status: card ? "paid_online" : "unpaid",
    payment_method: card ? "card" : "cash",
    paypal_order_id: card ? yocoId : null,
    paypal_capture_id: card ? yocoId : null,
    shop_id: shop.id,
    product_summary: `${order.reference_code} · ${itemsLabel} · collect from ${shop.name}`,
    dispatcher_notes: `Shop ready: ${shop.name}. Package delivery — no passenger. Collect ${itemsLabel}, deliver to rider.`,
  });

  const { data } = await admin
    .from("rr_shop_orders")
    .update({ job_id: job.id, updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .select("*, items:rr_shop_order_items(*)")
    .single();
  return (data as ShopOrder) ?? { ...order, job_id: job.id };
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
