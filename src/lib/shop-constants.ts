/** Marketplace groceries — product pay-in-app. Fetch (pay at till) is separate. */
export const SHOP_DELIVERY_FEE = 35;
export const SHOP_MIN_ORDER = 50;
/** Village Ride take of product value. Shop keeps the rest. Not trip 90/10. */
export const SHOP_COMMISSION_PCT = 15;
export const SHOP_DRIVER_COLLECT = 25;
export const SHOP_PLATFORM_DELIVERY = 10;

export function shopNetPayable(productSubtotal: number) {
  const sales = Math.max(0, Math.round(productSubtotal));
  const commission = Math.round((sales * SHOP_COMMISSION_PCT) / 100);
  return { sales, commission, net: sales - commission };
}
