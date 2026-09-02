import { shopIsLaunchFree } from "@/lib/ops-policy";

/** Marketplace groceries — product pay-in-app. Fetch (pay at till) is separate. */
export const SHOP_DELIVERY_FEE = 35;
export const SHOP_MIN_ORDER = 50;
/** Village Ride take of product value after the launch-free window. Shop keeps the rest. */
export const SHOP_COMMISSION_PCT = 15;
export const SHOP_DRIVER_COLLECT = 25;
export const SHOP_PLATFORM_DELIVERY = 10;

export function shopNetPayable(
  productSubtotal: number,
  shopCreatedAt?: string | null,
) {
  const sales = Math.max(0, Math.round(productSubtotal));
  const pct = shopIsLaunchFree(shopCreatedAt) ? 0 : SHOP_COMMISSION_PCT;
  const commission = Math.round((sales * pct) / 100);
  return { sales, commission, net: sales - commission, pct };
}
