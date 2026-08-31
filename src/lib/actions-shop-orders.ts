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
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mergeJobDetails } from "@/lib/job-status";
import {
  SHOP_DELIVERY_FALLBACK,
  type ShopDeliveryStage,
} from "@/lib/shop-delivery";
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

  return attachShopPing(
    ((data ?? []) as ShopOrder[]).map((o) => ({
      ...o,
      items: o.items ?? [],
    })),
  );
}

async function attachShopPing(orders: ShopOrder[]): Promise<ShopOrder[]> {
  const jobIds = orders.map((o) => o.job_id).filter((id): id is string => Boolean(id));
  if (!jobIds.length) return orders;
  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("rr_jobs")
    .select("id, dispatch_exhausted")
    .in("id", jobIds);
  const byId = new Map(
    (jobs ?? []).map((j) => [j.id as string, Boolean(j.dispatch_exhausted)]),
  );
  return orders.map((o) => ({
    ...o,
    dispatch_exhausted: o.job_id ? byId.get(o.job_id) : false,
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
    } catch (err) {
      console.error("[shop] dispatch after ready failed", err);
    }
  }
  revalidateShopPaths(order.shop_id);
  return order;
}

export async function retryShopDeliveryDispatch(
  orderId: string,
): Promise<ShopOrder> {
  if (!useAdmin()) {
    const order = mockRepo.retryShopDeliveryDispatch(orderId);
    revalidateShopPaths(order.shop_id);
    return order;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_shop_orders")
    .select("*, items:rr_shop_order_items(*)")
    .eq("id", orderId)
    .single();
  if (error) throw new Error(error.message);
  const order = await dispatchShopDelivery(data as ShopOrder);
  revalidateShopPaths(order.shop_id);
  return order;
}

export async function listShopOrdersByPhone(
  phone: string,
): Promise<ShopOrder[]> {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return [];
  if (!useAdmin()) return mockRepo.listShopOrdersByPhone(phone);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_shop_orders")
    .select("*, items:rr_shop_order_items(*)")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    if (/rr_shop_orders|does not exist|schema cache/i.test(error.message)) {
      return mockRepo.listShopOrdersByPhone(phone);
    }
    throw new Error(error.message);
  }
  return ((data ?? []) as ShopOrder[])
    .filter((o) =>
      o.customer_phone.replace(/\D/g, "").endsWith(digits.slice(-9)),
    )
    .map((o) => ({ ...o, items: o.items ?? [] }));
}

async function patchShopOrderByJobId(
  jobId: string,
  patch: Record<string, unknown>,
) {
  if (!useAdmin()) {
    mockRepo.patchShopOrderByJobId(jobId, patch);
    return;
  }
  const admin = createAdminClient();
  const payload = { ...patch, updated_at: new Date().toISOString() };
  const { error } = await admin
    .from("rr_shop_orders")
    .update(payload)
    .eq("job_id", jobId);
  if (error && /column|schema cache/i.test(error.message)) {
    const slim = { ...payload };
    delete slim.driver_id;
    delete slim.driver_accepted_at;
    delete slim.collected_at;
    delete slim.delivered_at;
    await admin.from("rr_shop_orders").update(slim).eq("job_id", jobId);
  }
}

export async function syncShopOrderDriverAccepted(
  jobId: string,
  driverId: string,
) {
  await patchShopOrderByJobId(jobId, {
    driver_id: driverId,
    driver_accepted_at: new Date().toISOString(),
  });
}

export async function syncShopOrderOutForDelivery(jobId: string) {
  await patchShopOrderByJobId(jobId, { status: "out_for_delivery" });
}

export async function syncShopOrderDelivered(jobId: string) {
  await patchShopOrderByJobId(jobId, {
    status: "delivered",
    delivered_at: new Date().toISOString(),
  });
}

export async function advanceShopDelivery(
  jobId: string,
  driverId: string,
  stage: ShopDeliveryStage,
  collectedPhoto?: string | null,
): Promise<void> {
  if (!useAdmin()) {
    mockRepo.advanceShopDelivery(jobId, driverId, stage, collectedPhoto);
    revalidateShopPaths();
    return;
  }

  const { markDriverArrived, startTrip, completeTrip } = await import(
    "@/lib/actions"
  );
  const admin = createAdminClient();

  async function patchDetails(patch: Record<string, unknown>) {
    const { data: job, error } = await admin
      .from("rr_jobs")
      .select("details, driver_id, payment_method")
      .eq("id", jobId)
      .single();
    if (error || !job) throw new Error(error?.message ?? "Job not found");
    if (job.driver_id !== driverId) throw new Error("Not your job");
    await admin
      .from("rr_jobs")
      .update({
        details: mergeJobDetails(job.details, patch),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("driver_id", driverId);
    return job;
  }

  if (stage === "at_shop") {
    await markDriverArrived(jobId, driverId);
    await patchDetails({ shop_delivery_stage: "at_shop" });
    return;
  }
  if (stage === "collected") {
    if (!collectedPhoto?.startsWith("data:image")) {
      throw new Error("Take a photo of the packed bag before collecting.");
    }
    await patchDetails({
      shop_delivery_stage: "collected",
      collected_photo_data_url: collectedPhoto.slice(0, 400_000),
    });
    await patchShopOrderByJobId(jobId, {
      collected_at: new Date().toISOString(),
    });
    return;
  }
  if (stage === "on_the_way") {
    await startTrip(jobId, driverId);
    await patchDetails({ shop_delivery_stage: "on_the_way" });
    await syncShopOrderOutForDelivery(jobId);
    return;
  }
  if (stage === "at_dropoff") {
    await patchDetails({
      shop_delivery_stage: "at_dropoff",
      dropoff_arrived_at: new Date().toISOString(),
    });
    return;
  }
  if (stage === "delivered") {
    const job = await patchDetails({ shop_delivery_stage: "delivered" });
    const cash = job.payment_method === "cash";
    await completeTrip(
      jobId,
      driverId,
      cash ? { cashCollected: true } : undefined,
    );
    await syncShopOrderDelivered(jobId);
  }
}

async function dispatchShopDelivery(order: ShopOrder): Promise<ShopOrder> {
  if (order.job_id) {
    try {
      const { matchJobAfterCreate } = await import("@/lib/matching");
      await matchJobAfterCreate(order.job_id);
    } catch {
      /* offer already in flight */
    }
    return order;
  }
  const admin = createAdminClient();
  const shop = await getShopById(order.shop_id);
  if (!shop) return order;

  const pickupLat =
    shop.lat ?? order.delivery_lat ?? SHOP_DELIVERY_FALLBACK.lat;
  const pickupLng =
    shop.lng ?? order.delivery_lng ?? SHOP_DELIVERY_FALLBACK.lng;
  const dropLat = order.delivery_lat ?? pickupLat;
  const dropLng = order.delivery_lng ?? pickupLng;

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
    required_vehicle: "motorcycle",
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
      shop_phone: shop.phone,
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
  const next = (data as ShopOrder) ?? { ...order, job_id: job.id };
  return {
    ...next,
    dispatch_exhausted: Boolean(
      (job as { dispatch_exhausted?: boolean }).dispatch_exhausted,
    ),
  };
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

const SHOP_PHOTOS_BUCKET = "shop-products";

export async function uploadShopProductPhoto(
  shopId: string,
  formData: FormData,
): Promise<{ url: string }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("A product photo is required.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Photo must be under 5MB.");
  }
  if (!shopId) throw new Error("Shop is required.");

  if (!useAdmin()) {
    return { url: `/shops/prod-staples.jpg` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to upload photos.");

  const admin = createAdminClient();
  const { data: shop } = await admin
    .from("rr_shops")
    .select("id, user_id")
    .eq("id", shopId)
    .maybeSingle();
  if (!shop || shop.user_id !== user.id) {
    const { data: profile } = await admin
      .from("rr_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin" && profile?.role !== "dispatcher") {
      throw new Error("You can only add photos to your own shop.");
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext === "png" || ext === "webp" ? ext : "jpg";
  const path = `${shopId}/${Date.now()}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(SHOP_PHOTOS_BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) {
    throw new Error(
      error.message.includes("Bucket") || error.message.includes("not found")
        ? "Photo storage is not set up yet. Run supabase/SHOP_PRODUCT_PHOTOS.sql."
        : error.message,
    );
  }
  const { data: pub } = admin.storage.from(SHOP_PHOTOS_BUCKET).getPublicUrl(path);
  return { url: pub.publicUrl };
}
