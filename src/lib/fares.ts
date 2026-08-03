import type { ServiceType, VehicleType } from "./types";
import { distanceKm } from "./geo";
import {
  isNightWindow,
  NIGHT_SURCHARGE_PCT,
  parseScheduleAt,
} from "./night-fare";
import {
  DEFAULT_COUNTRY,
  getCountry,
  type CountryCode,
} from "./countries";
import {
  calculateUnifiedFare,
  normalizeWeightCategory,
  type WeightCategory,
} from "./pricing";

export type FareBreakdown = {
  /**
   * Total the rider pays (driver fare + platform booking fee).
   * Payment A/B/C: see src/lib/pricing.ts comments.
   */
  fee_amount: number;
  /** Sacred driver fare: base + km (+ night), min-enforced. */
  driver_fare_amount: number;
  /** Platform booking fee. 0 with Village Pass. */
  booking_fee: number;
  /**
   * Legacy % commission (0 under flat-fee model).
   * Kept for old jobs; new quotes set 0 so wallet uses booking_fee.
   */
  platform_commission: number;
  /** Amount credited to driver on card complete (= driver fare). */
  driver_payout: number;
  currency: string;
  /** Base fare component (before km / night) */
  base_fee_amount: number;
  distance_fare: number;
  distance_km: number;
  weight_category: WeightCategory | null;
  is_night_ride: boolean;
  night_surcharge_pct: number;
  night_surcharge_amount: number;
  village_pass: boolean;
  country_code?: CountryCode;
};

/** Server-side fare — never trust client fee for charging. */
export function calculateFare(params: {
  vehicle: VehicleType;
  serviceType?: ServiceType | null;
  countryCode?: string | null;
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  at?: string | Date | null;
  isSubscribed?: boolean;
  weightCategory?: WeightCategory | string | null;
  /** @deprecated Prefer unified pricing; ignored when serviceType set */
  rules?: {
    base_fare: number;
    per_km: number;
    platform_commission_pct: number;
    currency?: string;
  } | null;
}): FareBreakdown {
  const countryCode = (params.countryCode as CountryCode) || DEFAULT_COUNTRY;
  const serviceType: ServiceType =
    params.serviceType ||
    (params.vehicle === "sedan"
      ? "ride"
      : params.vehicle === "motorcycle"
        ? "courier"
        : params.vehicle === "truck"
          ? "farm"
          : "delivery");

  let km = 0;
  if (
    params.pickup?.lat != null &&
    params.pickup?.lng != null &&
    params.dropoff?.lat != null &&
    params.dropoff?.lng != null
  ) {
    km = distanceKm(params.pickup, params.dropoff);
  }

  const when =
    params.at instanceof Date
      ? params.at
      : parseScheduleAt(
          typeof params.at === "string" ? params.at : null,
        );
  const night = isNightWindow(when);

  const unified = calculateUnifiedFare({
    serviceType,
    distanceKm: km,
    weightCategory:
      serviceType === "delivery" || serviceType === "farm"
        ? normalizeWeightCategory(params.weightCategory)
        : null,
    countryCode,
    isSubscribed: params.isSubscribed,
    nightSurchargePct: night ? NIGHT_SURCHARGE_PCT : 0,
  });

  // Flat platform-fee model: no % commission on new quotes.
  // driver_payout = sacred driver fare (card Scenario B: total − platform_fee).
  return {
    fee_amount: unified.total_fare,
    driver_fare_amount: unified.driver_fare,
    booking_fee: unified.platform_fee,
    platform_commission: 0,
    driver_payout: unified.driver_fare,
    currency: unified.currency,
    base_fee_amount: unified.base_fare,
    distance_fare: unified.distance_fare,
    distance_km: unified.distance_km,
    weight_category: unified.weight_category,
    is_night_ride: unified.is_night_ride,
    night_surcharge_pct: night ? NIGHT_SURCHARGE_PCT : 0,
    night_surcharge_amount: unified.night_surcharge_amount,
    village_pass: unified.village_pass,
    country_code: getCountry(countryCode).code,
  };
}
