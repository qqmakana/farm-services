import { distanceKm } from "./geo";
import type { JobNeeds } from "./job-needs";
import type { Driver, VehicleType } from "./types";
import { vehicleFitsJob } from "./vehicles";

/** Weights — total typically ~0–220 for a strong candidate. */
export const DISPATCH_WEIGHTS = {
  vehicleExact: 40,
  vehicleUpgrade: 25, // truck covering bakkie job
  optInNight: 30,
  optInHeavy: 25,
  optInVillage: 20,
  ratingMax: 40, // rating_avg / 5 * 40
  acceptanceMax: 35,
  proximityMax: 40, // decays with km
  proximityKmFullPenalty: 20, // 0 proximity points beyond this
  verified: 15,
} as const;

export type MatchBreakdown = {
  total: number;
  vehicle: number;
  opt_in: number;
  rating: number;
  acceptance: number;
  proximity: number;
  verified: number;
  distance_km: number | null;
  acceptance_rate: number;
};

export type ScoredDriver = {
  driver: Driver;
  score: number;
  breakdown: MatchBreakdown;
};

export function driverAcceptanceRate(
  driver: Pick<
    Driver,
    "offers_received" | "offers_accepted" | "offers_declined"
  >,
): number {
  const received = Number(driver.offers_received) || 0;
  const accepted = Number(driver.offers_accepted) || 0;
  const declined = Number(driver.offers_declined) || 0;
  // Prefer explicit offers_received; fall back to accepts+declines
  const denom = received > 0 ? received : accepted + declined;
  if (denom <= 0) return 0.85; // new driver: slightly optimistic prior
  return Math.min(1, Math.max(0, accepted / denom));
}

function vehicleScore(
  driverVehicle: string,
  required: VehicleType,
): number {
  if (!vehicleFitsJob(driverVehicle, required)) return -Infinity;
  const v = driverVehicle.toLowerCase();
  if (v === required) return DISPATCH_WEIGHTS.vehicleExact;
  // Truck covering bakkie = capable upgrade, not exact
  if (required === "bakkie" && v === "truck") {
    return DISPATCH_WEIGHTS.vehicleUpgrade;
  }
  return DISPATCH_WEIGHTS.vehicleExact;
}

function optInScore(
  driver: Pick<
    Driver,
    "prefer_night" | "prefer_heavy" | "prefer_village_routes"
  >,
  needs: JobNeeds,
): number {
  let score = 0;
  if (needs.night) {
    if (driver.prefer_night === false) return -Infinity;
    score += DISPATCH_WEIGHTS.optInNight;
  }
  if (needs.heavy) {
    if (driver.prefer_heavy === false) return -Infinity;
    score += DISPATCH_WEIGHTS.optInHeavy;
  }
  if (needs.village) {
    if (driver.prefer_village_routes === false) return -Infinity;
    score += DISPATCH_WEIGHTS.optInVillage;
  }
  return score;
}

function proximityScore(distanceKmValue: number | null): number {
  if (distanceKmValue == null) return DISPATCH_WEIGHTS.proximityMax * 0.4;
  const max = DISPATCH_WEIGHTS.proximityMax;
  const span = DISPATCH_WEIGHTS.proximityKmFullPenalty;
  return Math.max(0, max * (1 - distanceKmValue / span));
}

/**
 * Score one driver for a job. Returns -Infinity if hard-ineligible
 * (wrong vehicle or opted out of a required niche).
 */
export function scoreDriverForJob(params: {
  driver: Driver;
  requiredVehicle: VehicleType;
  needs: JobNeeds;
  pickup: { lat: number; lng: number } | null;
}): ScoredDriver {
  const { driver, requiredVehicle, needs, pickup } = params;

  const vehicle = vehicleScore(driver.vehicle_type, requiredVehicle);
  const opt_in = optInScore(driver, needs);

  let distance_km: number | null = null;
  if (
    pickup &&
    driver.last_lat != null &&
    driver.last_lng != null
  ) {
    distance_km = distanceKm(
      { lat: driver.last_lat, lng: driver.last_lng },
      pickup,
    );
  }

  const acceptance_rate = driverAcceptanceRate(driver);
  const rating =
    (Math.min(5, Math.max(0, Number(driver.rating_avg) || 5)) / 5) *
    DISPATCH_WEIGHTS.ratingMax;
  const acceptance = acceptance_rate * DISPATCH_WEIGHTS.acceptanceMax;
  const proximity = proximityScore(distance_km);
  const verified = driver.id_verified ? DISPATCH_WEIGHTS.verified : 0;

  if (!Number.isFinite(vehicle) || !Number.isFinite(opt_in)) {
    return {
      driver,
      score: Number.NEGATIVE_INFINITY,
      breakdown: {
        total: Number.NEGATIVE_INFINITY,
        vehicle: Number.isFinite(vehicle) ? vehicle : 0,
        opt_in: Number.isFinite(opt_in) ? opt_in : 0,
        rating,
        acceptance,
        proximity,
        verified,
        distance_km,
        acceptance_rate,
      },
    };
  }

  const total =
    vehicle + opt_in + rating + acceptance + proximity + verified;

  return {
    driver,
    score: Math.round(total * 100) / 100,
    breakdown: {
      total: Math.round(total * 100) / 100,
      vehicle,
      opt_in,
      rating: Math.round(rating * 100) / 100,
      acceptance: Math.round(acceptance * 100) / 100,
      proximity: Math.round(proximity * 100) / 100,
      verified,
      distance_km:
        distance_km != null ? Math.round(distance_km * 100) / 100 : null,
      acceptance_rate: Math.round(acceptance_rate * 1000) / 1000,
    },
  };
}

/** Rank candidates highest score first; ties → closer → higher rating. */
export function rankDriversForJob(params: {
  drivers: Driver[];
  requiredVehicle: VehicleType;
  needs: JobNeeds;
  pickup: { lat: number; lng: number } | null;
}): ScoredDriver[] {
  return params.drivers
    .map((driver) =>
      scoreDriverForJob({
        driver,
        requiredVehicle: params.requiredVehicle,
        needs: params.needs,
        pickup: params.pickup,
      }),
    )
    .filter((s) => Number.isFinite(s.score))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = a.breakdown.distance_km ?? 9999;
      const db = b.breakdown.distance_km ?? 9999;
      if (da !== db) return da - db;
      return (
        (Number(b.driver.rating_avg) || 0) - (Number(a.driver.rating_avg) || 0)
      );
    });
}
