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

export type FareBreakdown = {
  fee_amount: number;
  platform_commission: number;
  driver_payout: number;
  currency: string;
  /** Base fare before after-hours surcharge */
  base_fee_amount: number;
  is_night_ride: boolean;
  night_surcharge_pct: number;
  night_surcharge_amount: number;
  country_code?: CountryCode;
};

function resolveRate(params: {
  vehicle: VehicleType;
  serviceType?: ServiceType | null;
  countryCode?: string | null;
}): { base: number; perKm: number; commissionPct: number; currency: string } {
  const country = getCountry(params.countryCode);
  const p = country.pricing;

  if (params.vehicle === "truck") {
    return {
      base: p.truck.base,
      perKm: p.truck.perKm,
      commissionPct: p.commissionPct,
      currency: p.currency,
    };
  }

  const service = params.serviceType;
  if (service === "ride") {
    return {
      base: p.ride.base,
      perKm: p.ride.perKm,
      commissionPct: p.commissionPct,
      currency: p.currency,
    };
  }
  if (service === "delivery") {
    return {
      base: p.delivery.base,
      perKm: p.delivery.perKm,
      commissionPct: p.commissionPct,
      currency: p.currency,
    };
  }
  if (service === "farm") {
    return {
      base: p.farm.base,
      perKm: p.farm.perKm,
      commissionPct: p.commissionPct,
      currency: p.currency,
    };
  }

  // Legacy vehicle-only path
  if (params.vehicle === "sedan") {
    return {
      base: p.ride.base,
      perKm: p.ride.perKm,
      commissionPct: p.commissionPct,
      currency: p.currency,
    };
  }
  // bakkie → farm base (historical SA default)
  return {
    base: p.farm.base,
    perKm: p.farm.perKm,
    commissionPct: p.commissionPct,
    currency: p.currency,
  };
}

/** Server-side fare — never trust client fee for charging. */
export function calculateFare(params: {
  vehicle: VehicleType;
  serviceType?: ServiceType | null;
  countryCode?: string | null;
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  /** ISO datetime or null = now (Ride Now) */
  at?: string | Date | null;
  rules?: {
    base_fare: number;
    per_km: number;
    platform_commission_pct: number;
    currency?: string;
  } | null;
}): FareBreakdown {
  const countryCode = (params.countryCode as CountryCode) || DEFAULT_COUNTRY;
  const fromCountry = resolveRate({
    vehicle: params.vehicle,
    serviceType: params.serviceType,
    countryCode,
  });

  const rule = params.rules
    ? {
        base: Number(params.rules.base_fare),
        perKm: Number(params.rules.per_km),
        commissionPct: Number(params.rules.platform_commission_pct),
        currency: params.rules.currency || fromCountry.currency,
      }
    : fromCountry;

  let km = 0;
  if (
    params.pickup?.lat != null &&
    params.pickup?.lng != null &&
    params.dropoff?.lat != null &&
    params.dropoff?.lng != null
  ) {
    km = distanceKm(params.pickup, params.dropoff);
  }

  const baseFee = Math.round(rule.base + km * rule.perKm);
  const when =
    params.at instanceof Date
      ? params.at
      : parseScheduleAt(
          typeof params.at === "string" ? params.at : null,
        );
  const night = isNightWindow(when);
  const surcharge = night
    ? Math.round((baseFee * NIGHT_SURCHARGE_PCT) / 100)
    : 0;
  const fee = baseFee + surcharge;
  const commission = Math.round((fee * rule.commissionPct) / 100);
  const payout = Math.max(0, fee - commission);

  return {
    fee_amount: fee,
    platform_commission: commission,
    driver_payout: payout,
    currency: rule.currency,
    base_fee_amount: baseFee,
    is_night_ride: night,
    night_surcharge_pct: night ? NIGHT_SURCHARGE_PCT : 0,
    night_surcharge_amount: surcharge,
    country_code: getCountry(countryCode).code,
  };
}
