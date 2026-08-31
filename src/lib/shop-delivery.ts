import { SHOP_DRIVER_COLLECT } from "@/lib/shop-constants";
import type { Job, ShopOrder } from "@/lib/types";
import { isShopPackageJob, itemCountFromJob, shopNameFromJob } from "@/lib/package-job";

/** Westdene — used when a shop or rider has a landmark but no GPS pin. */
export const SHOP_DELIVERY_FALLBACK = {
  lat: -26.1908,
  lng: 27.9892,
} as const;

export type ShopDeliveryStage =
  | "accepted"
  | "at_shop"
  | "collected"
  | "on_the_way"
  | "at_dropoff"
  | "delivered";

export const SHOP_DELIVERY_STEPS: {
  stage: ShopDeliveryStage;
  label: string;
}[] = [
  { stage: "at_shop", label: "Arrived at Shop" },
  { stage: "collected", label: "Collected" },
  { stage: "on_the_way", label: "On the Way" },
  { stage: "at_dropoff", label: "Arrived" },
  { stage: "delivered", label: "Delivered" },
];

export const RIDER_SHOP_TRACK = [
  "Order Placed",
  "Packed",
  "Driver Collecting",
  "On the Way",
  "Delivered",
] as const;

export function shopDeliveryStageFromJob(
  job: Pick<Job, "details" | "status"> | null | undefined,
): ShopDeliveryStage | null {
  if (!job) return null;
  const details = job.details as Record<string, unknown>;
  const stage = details?.shop_delivery_stage;
  if (
    stage === "at_shop" ||
    stage === "collected" ||
    stage === "on_the_way" ||
    stage === "at_dropoff" ||
    stage === "delivered"
  ) {
    return stage;
  }
  if (job.status === "in_progress") return "on_the_way";
  if (job.status === "completed") return "delivered";
  if (job.status === "confirmed" || job.status === "assigned") return "accepted";
  return null;
}

export function nextShopDeliveryStage(
  current: ShopDeliveryStage | null,
): ShopDeliveryStage | null {
  if (!current || current === "accepted") return "at_shop";
  if (current === "at_shop") return "collected";
  if (current === "collected") return "on_the_way";
  if (current === "on_the_way") return "at_dropoff";
  if (current === "at_dropoff") return "delivered";
  return null;
}

export function riderShopTrackIndex(order: ShopOrder): number {
  if (order.status === "delivered" || order.delivered_at) return 4;
  if (order.status === "cancelled") return 0;
  if (order.collected_at || order.status === "out_for_delivery") return 3;
  if (order.driver_id) return 2;
  if (order.status === "ready" || order.status === "preparing") return 1;
  return 0;
}

export function shopDriverEarn(job: Pick<Job, "driver_payout" | "shop_id">): number {
  const payout = Number(job.driver_payout);
  if (Number.isFinite(payout) && payout > 0) return payout;
  if (job.shop_id) return SHOP_DRIVER_COLLECT;
  return SHOP_DRIVER_COLLECT;
}

export function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function shopPhoneFromJob(
  job: Pick<Job, "details"> & { shops?: { phone?: string } | null },
): string | null {
  const fromShop = job.shops?.phone?.trim();
  if (fromShop) return fromShop;
  const details = job.details as Record<string, unknown>;
  if (typeof details.shop_phone === "string" && details.shop_phone.trim()) {
    return details.shop_phone.trim();
  }
  return null;
}

export function shopDeliveryOfferLines(job: Job) {
  const items = itemCountFromJob(job);
  return {
    shop: shopNameFromJob(job),
    pickup: job.pickup_landmark,
    dropoff: job.dropoff_landmark,
    items: items ?? 0,
    earn: shopDriverEarn(job),
    isShop: isShopPackageJob(job),
  };
}
