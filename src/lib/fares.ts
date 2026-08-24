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

export function detailsIsExpress(details: unknown): boolean {
  if (!details || typeof details !== "object") return false;
  return Boolean((details as { is_express?: unknown }).is_express);
}

export function detailsIsInsured(details: unknown): boolean {
  if (!details || typeof details !== "object") return false;
  const d = details as { insurance?: unknown; insured?: unknown };
  return Boolean(d.insurance) || Boolean(d.insured);
}

export type FareBreakdown = {
  /**
   * Total the rider pays (cash or card). 90/10 is taken from this, not added.
   */
  fee_amount: number;
  /** Driver keep — 90% of the rider fare. */
  driver_fare_amount: number;
  /**
   * No extra booking fee on new quotes (0). Legacy jobs may still have R5.
   */
  booking_fee: number;
  /** Village Ride take — 10% of the rider fare. */
  platform_commission: number;
  /** Amount credited to driver on card complete (90%). */
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
  /** Driving duration from Mapbox Directions; 0 when unused. */
  route_duration_seconds: number;
  /**
   * True only when both pins were present and a driving route (or same-point
   * 0 km) was applied. Incomplete quotes must not be treated as a fare.
   */
  quote_ready: boolean;
  reservation_fee: number;
  express_extra: number;
  express_multiplier: number;
  insurance_fee: number;
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
  /**
   * Road distance from Mapbox Directions. When set (including 0), this is the
   * only distance used for R/km. Do not pass haversine here for charging.
   */
  routeDistanceKm?: number | null;
  routeDurationSeconds?: number | null;
  quoteReady?: boolean;
  applyReservationFee?: boolean;
  isExpress?: boolean;
  applyInsurance?: boolean;
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

  const havePins =
    params.pickup?.lat != null &&
    params.pickup?.lng != null &&
    params.dropoff?.lat != null &&
    params.dropoff?.lng != null;

  let km = 0;
  if (params.routeDistanceKm != null && Number.isFinite(params.routeDistanceKm)) {
    km = Math.max(0, Number(params.routeDistanceKm));
  } else if (havePins) {
    // Formula tests / matching helpers only. Charging must pass routeDistanceKm.
    km = distanceKm(params.pickup!, params.dropoff!);
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
    applyReservationFee: Boolean(params.applyReservationFee),
    isExpress: Boolean(params.isExpress),
    applyInsurance: Boolean(params.applyInsurance),
  });

  // Rider pays `total_fare`. Platform 10% is stored as platform_commission
  // (wallet remittance / card keep). No extra booking fee on new quotes.
  return {
    fee_amount: unified.total_fare,
    driver_fare_amount: unified.driver_fare,
    booking_fee: 0,
    platform_commission: unified.platform_fee,
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
    route_duration_seconds: Math.max(
      0,
      Math.round(Number(params.routeDurationSeconds ?? 0) || 0),
    ),
    quote_ready: params.quoteReady ?? Boolean(
      params.routeDistanceKm != null && Number.isFinite(params.routeDistanceKm),
    ),
    reservation_fee: unified.reservation_fee,
    express_extra: unified.express_extra,
    express_multiplier: unified.express_multiplier,
    insurance_fee: unified.insurance_fee,
  };
}
