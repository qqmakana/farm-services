import type { VehicleType } from "./types";
import { distanceKm } from "./geo";

export type FareBreakdown = {
  fee_amount: number;
  platform_commission: number;
  driver_payout: number;
  currency: string;
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

  const fee = Math.round(rule.base + km * rule.perKm);
  const commission = Math.round((fee * rule.commissionPct) / 100);
  const payout = Math.max(0, fee - commission);

  return {
    fee_amount: fee,
    platform_commission: commission,
    driver_payout: payout,
    currency: "ZAR",
  };
}
