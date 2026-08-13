/**
 * Unified Village Ride pricing — source of truth (ZA bands).
 *
 * Ride & Courier: distance only.
 * Delivery & Farm: weight category + distance.
 *
 * Payment scenarios (platform_fee = booking fee):
 * A) CASH — rider pays total to driver; on complete deduct platform_fee from wallet.
 * B) CARD — rider pays total via PayPal (capture in src/lib/paypal.ts); on complete
 *    credit driver (total − platform_fee).
 * C) VILLAGE PASS — platform_fee = 0; rider pays driver fare only; driver keeps 100%.
 */

import type { ServiceType } from "./types";
import { getCountry } from "./countries";
import { VILLAGE_PASS_BOOKING_FEE_ZAR } from "./village-pass";

export type WeightCategory =
  | "light"
  | "medium"
  | "heavy"
  | "extra_heavy";

export const WEIGHT_CATEGORIES: readonly {
  id: WeightCategory;
  label: string;
  hint: string;
}[] = [
  {
    id: "light",
    label: "Light (Under 10kg)",
    hint: "Groceries, small boxes",
  },
  {
    id: "medium",
    label: "Medium (10–30kg)",
    hint: "Furniture, appliances",
  },
  {
    id: "heavy",
    label: "Heavy (30–100kg)",
    hint: "Large furniture, equipment",
  },
  {
    id: "extra_heavy",
    label: "Extra Heavy (100kg+)",
    hint: "Very heavy items",
  },
] as const;

export type ServiceRate = {
  base_fare: number;
  per_km_rate: number;
  platform_fee: number;
  minimum_fare: number;
  currency: string;
  weight_category: WeightCategory | null;
};

/** ZA tables from product spec */
const ZA_RIDE_COURIER = {
  base_fare: 15,
  per_km_rate: 10,
  platform_fee: VILLAGE_PASS_BOOKING_FEE_ZAR,
  minimum_fare: 25,
};

const ZA_DELIVERY: Record<
  WeightCategory,
  { base_fare: number; per_km_rate: number }
> = {
  light: { base_fare: 20, per_km_rate: 12 },
  medium: { base_fare: 35, per_km_rate: 15 },
  heavy: { base_fare: 60, per_km_rate: 20 },
  extra_heavy: { base_fare: 100, per_km_rate: 30 },
};

const ZA_FARM: Record<
  WeightCategory,
  { base_fare: number; per_km_rate: number }
> = {
  light: { base_fare: 25, per_km_rate: 15 },
  medium: { base_fare: 40, per_km_rate: 18 },
  heavy: { base_fare: 70, per_km_rate: 25 },
  extra_heavy: { base_fare: 120, per_km_rate: 35 },
};

/** Scale ZA amounts to another market using ride base ratio. */
function scaleAmount(zarAmount: number, countryCode?: string | null): number {
  const c = getCountry(countryCode);
  if (c.currency === "ZAR") return zarAmount;
  const ratio = c.pricing.ride.base / ZA_RIDE_COURIER.base_fare;
  return Math.max(1, Math.round(zarAmount * ratio));
}

export function normalizeWeightCategory(
  value: string | null | undefined,
): WeightCategory {
  if (
    value === "light" ||
    value === "medium" ||
    value === "heavy" ||
    value === "extra_heavy"
  ) {
    return value;
  }
  // Legacy delivery sizes
  if (value === "small" || value === "under_5" || value === "5_10") {
    return "light";
  }
  if (value === "10_20" || value === "medium") return "medium";
  if (value === "large") return "heavy";
  if (value === "xl") return "extra_heavy";
  return "light";
}

/** Suggest bakkie vs truck from weight band. */
export function vehicleForWeight(weight: WeightCategory): "bakkie" | "truck" {
  return weight === "heavy" || weight === "extra_heavy" ? "truck" : "bakkie";
}

/**
 * Resolve rate row for a service (+ weight for delivery/farm).
 */
export function getServiceRate(params: {
  serviceType: ServiceType;
  countryCode?: string | null;
  weightCategory?: WeightCategory | string | null;
}): ServiceRate {
  const country = getCountry(params.countryCode);
  const currency = country.currency;
  const weight =
    params.serviceType === "delivery" || params.serviceType === "farm"
      ? normalizeWeightCategory(params.weightCategory)
      : null;

  if (params.serviceType === "ride" || params.serviceType === "courier") {
    return {
      base_fare: scaleAmount(ZA_RIDE_COURIER.base_fare, params.countryCode),
      per_km_rate: scaleAmount(ZA_RIDE_COURIER.per_km_rate, params.countryCode),
      platform_fee: scaleAmount(ZA_RIDE_COURIER.platform_fee, params.countryCode),
      minimum_fare: scaleAmount(ZA_RIDE_COURIER.minimum_fare, params.countryCode),
      currency,
      weight_category: null,
    };
  }

  const band =
    params.serviceType === "farm"
      ? ZA_FARM[weight || "light"]
      : ZA_DELIVERY[weight || "light"];

  const base = scaleAmount(band.base_fare, params.countryCode);
  const perKm = scaleAmount(band.per_km_rate, params.countryCode);
  return {
    base_fare: base,
    per_km_rate: perKm,
    platform_fee: scaleAmount(VILLAGE_PASS_BOOKING_FEE_ZAR, params.countryCode),
    minimum_fare: base, // min = band base
    currency,
    weight_category: weight,
  };
}

export type UnifiedFareBreakdown = {
  service_type: ServiceType;
  weight_category: WeightCategory | null;
  distance_km: number;
  base_fare: number;
  distance_fare: number;
  /** Driver fare before platform fee (min-enforced, + night). Sacred. */
  driver_fare: number;
  /** Platform booking fee — 0 with Village Pass */
  platform_fee: number;
  total_fare: number;
  currency: string;
  village_pass: boolean;
  minimum_fare: number;
  is_night_ride: boolean;
  night_surcharge_amount: number;
};

/**
 * Core calculator used by fares.ts / quote / createJob.
 * Pass distanceKm explicitly when known; otherwise 0 (base-only quote).
 */
export function calculateUnifiedFare(params: {
  serviceType: ServiceType;
  distanceKm: number;
  weightCategory?: WeightCategory | string | null;
  countryCode?: string | null;
  isSubscribed?: boolean;
  nightSurchargePct?: number;
}): UnifiedFareBreakdown {
  const rate = getServiceRate({
    serviceType: params.serviceType,
    countryCode: params.countryCode,
    weightCategory: params.weightCategory,
  });
  const km = Math.max(0, Number(params.distanceKm) || 0);
  const distanceFare = Math.round(rate.per_km_rate * km);
  let driverRaw = rate.base_fare + distanceFare;
  if (driverRaw < rate.minimum_fare) driverRaw = rate.minimum_fare;

  const nightPct = params.nightSurchargePct ?? 0;
  const nightAmt =
    nightPct > 0 ? Math.round((driverRaw * nightPct) / 100) : 0;
  const driverFare = driverRaw + nightAmt;

  // Scenario C: Village Pass → platform_fee = 0
  const platformFee = params.isSubscribed ? 0 : rate.platform_fee;

  return {
    service_type: params.serviceType,
    weight_category: rate.weight_category,
    distance_km: Math.round(km * 10) / 10,
    base_fare: rate.base_fare,
    distance_fare: distanceFare,
    driver_fare: driverFare,
    platform_fee: platformFee,
    total_fare: driverFare + platformFee,
    currency: rate.currency,
    village_pass: Boolean(params.isSubscribed),
    minimum_fare: rate.minimum_fare,
    is_night_ride: nightAmt > 0,
    night_surcharge_amount: nightAmt,
  };
}

/**
 * Product API: `calculateFare(serviceType, distanceKm, weightCategory, opts?)`.
 * For night + lat/lng quotes use `fares.calculateFare`.
 */
export function calculateFare(
  serviceType: ServiceType,
  distanceKm: number,
  weightCategory?: WeightCategory | string | null,
  opts?: {
    countryCode?: string | null;
    isSubscribed?: boolean;
    nightSurchargePct?: number;
  },
): UnifiedFareBreakdown {
  return calculateUnifiedFare({
    serviceType,
    distanceKm,
    weightCategory,
    countryCode: opts?.countryCode,
    isSubscribed: opts?.isSubscribed,
    nightSurchargePct: opts?.nightSurchargePct,
  });
}
