import type { VehicleType } from "./types";
import { distanceKm } from "./geo";
import {
  isNightWindow,
  NIGHT_SURCHARGE_PCT,
  parseScheduleAt,
} from "./night-fare";

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
};

const FALLBACK: Record<
  VehicleType,
  { base: number; perKm: number; commissionPct: number }
> = {
  sedan: { base: 50, perKm: 8, commissionPct: 15 },
  bakkie: { base: 180, perKm: 12, commissionPct: 15 },
  truck: { base: 450, perKm: 18, commissionPct: 15 },
};

/** Server-side fare — never trust client fee for charging. */
export function calculateFare(params: {
  vehicle: VehicleType;
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  /** ISO datetime or null = now (Ride Now) */
  at?: string | Date | null;
  rules?: {
    base_fare: number;
    per_km: number;
    platform_commission_pct: number;
  } | null;
}): FareBreakdown {
  const rule = params.rules
    ? {
        base: Number(params.rules.base_fare),
        perKm: Number(params.rules.per_km),
        commissionPct: Number(params.rules.platform_commission_pct),
      }
    : FALLBACK[params.vehicle];

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
    currency: "ZAR",
    base_fee_amount: baseFee,
    is_night_ride: night,
    night_surcharge_pct: night ? NIGHT_SURCHARGE_PCT : 0,
    night_surcharge_amount: surcharge,
  };
}
