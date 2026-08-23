/**
 * Village Pass — R99/month PayPal subscription.
 * Priority matching subscription. Trip split stays 90% driver / 10% Village Ride.
 */

export const VILLAGE_PASS_PRICE_ZAR = 99;
export const VILLAGE_PASS_BOOKING_FEE_ZAR = 5;
export const VILLAGE_PASS_TIER = "village_pass";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "cancelled"
  | "expired"
  | "approval_pending";

export type RiderSubscription = {
  phone: string;
  user_id?: string | null;
  country_code?: string | null;
  subscription_status: SubscriptionStatus;
  subscription_tier: string;
  subscription_expires_at: string | null;
  paypal_subscription_id: string | null;
};

export function isSubscriptionActive(
  sub: Pick<
    RiderSubscription,
    "subscription_status" | "subscription_expires_at"
  > | null | undefined,
  now = new Date(),
): boolean {
  if (!sub) return false;
  if (sub.subscription_status !== "active") return false;
  if (!sub.subscription_expires_at) return true;
  return new Date(sub.subscription_expires_at).getTime() > now.getTime();
}

/** Platform booking fee — waived for Village Pass. Driver rate untouched. */
export function bookingFeeForRider(params: {
  isSubscribed: boolean;
  currency?: string | null;
  /** Prefer country so NGN/KES/etc. scale off local ride base, not ZAR R5. */
  countryCode?: string | null;
  /** Optional explicit ride base (same units as fare). */
  rideBase?: number | null;
}): number {
  // Driver rate is sacred. Subscription only waives platform fee.
  if (params.isSubscribed) return 0;

  // ~1/3 of ride base → ZA R15 → R5. Scales for NG/KE/IN/BR automatically.
  const base =
    params.rideBase != null && params.rideBase > 0
      ? params.rideBase
      : null;
  if (base != null) {
    return Math.max(1, Math.round(base / 3));
  }

  const cur = (params.currency || "ZAR").toUpperCase();
  if (cur === "ZAR") return VILLAGE_PASS_BOOKING_FEE_ZAR;
  if (cur === "USD" || cur === "EUR" || cur === "GBP" || cur === "CAD") {
    return 1;
  }
  // Fallback when country/base unknown — never stick R5 on NGN/KES
  if (cur === "NGN") return 100;
  if (cur === "KES") return 50;
  if (cur === "GHS") return 5;
  if (cur === "INR") return 20;
  if (cur === "BRL") return 3;
  if (cur === "PHP") return 30;
  return Math.max(1, Math.round(VILLAGE_PASS_BOOKING_FEE_ZAR));
}

export function addMonthsIso(from: Date, months = 1): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/** custom_id for PayPal — prefer phone so guest riders work without auth. */
export function subscriptionCustomId(params: {
  phone: string;
  userId?: string | null;
}): string {
  const phone = params.phone.replace(/\D/g, "").slice(0, 32);
  if (params.userId) return `uid:${params.userId}|p:${phone}`.slice(0, 127);
  return `phone:${phone}`.slice(0, 127);
}

export function parseSubscriptionCustomId(customId: string | null | undefined): {
  phone: string | null;
  userId: string | null;
} {
  if (!customId) return { phone: null, userId: null };
  const uid = customId.match(/uid:([^|]+)/)?.[1] ?? null;
  const phone =
    customId.match(/p:(\d+)/)?.[1] ??
    customId.match(/phone:(\d+)/)?.[1] ??
    null;
  return { phone, userId: uid };
}

/** Trips needed for R99 Pass to break even on waived R5 fees alone. */
export const VILLAGE_PASS_BREAKEVEN_TRIPS = Math.ceil(
  VILLAGE_PASS_PRICE_ZAR / VILLAGE_PASS_BOOKING_FEE_ZAR,
);

export type VillagePassSavings = {
  tripsThisMonth: number;
  savedThisMonthZar: number;
  tripsLifetime: number;
  savedLifetimeZar: number;
  /** savedThisMonth − R99 (negative = not yet ahead this month) */
  netVsPassPriceZar: number;
  breakevenTrips: number;
};

/** Savings = waived booking fees only. Driver fare never discounted. */
export function computeVillagePassSavings(params: {
  passTripCountThisMonth: number;
  passTripCountLifetime: number;
  feePerTrip?: number;
}): VillagePassSavings {
  const fee = params.feePerTrip ?? VILLAGE_PASS_BOOKING_FEE_ZAR;
  const tripsThisMonth = Math.max(0, params.passTripCountThisMonth);
  const tripsLifetime = Math.max(0, params.passTripCountLifetime);
  const savedThisMonthZar = tripsThisMonth * fee;
  const savedLifetimeZar = tripsLifetime * fee;
  return {
    tripsThisMonth,
    savedThisMonthZar,
    tripsLifetime,
    savedLifetimeZar,
    netVsPassPriceZar: savedThisMonthZar - VILLAGE_PASS_PRICE_ZAR,
    breakevenTrips: VILLAGE_PASS_BREAKEVEN_TRIPS,
  };
}
