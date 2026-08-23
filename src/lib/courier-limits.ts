import type { VehicleType } from "./types";

export const COURIER_MAX_KG = 15;

export const COURIER_TOO_HEAVY =
  "Courier max 15kg. Use Delivery for heavier items.";

const BAND_MAX_KG: Record<string, number> = {
  under_5: 5,
  "5_10": 10,
  "10_20": 20,
  small: 5,
  medium: 20,
  large: 50,
  xl: 100,
  light: 10,
  heavy: 100,
  extra_heavy: 150,
};

/** Best-effort kg from courier job details. `null` when unknown (treat as within limit). */
export function courierWeightKgFromDetails(details: unknown): number | null {
  if (!details || typeof details !== "object") return null;
  const d = details as Record<string, unknown>;

  for (const key of ["item_weight_kg", "weight_kg", "weightKg"] as const) {
    const n = Number(d[key]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const band =
    (typeof d.item_weight === "string" && d.item_weight) ||
    (typeof d.weight_category === "string" && d.weight_category) ||
    (typeof d.size === "string" && d.size) ||
    "";
  if (band && BAND_MAX_KG[band] != null) return BAND_MAX_KG[band];

  const blob = [d.item_description, d.special_instructions]
    .filter((v) => typeof v === "string")
    .join(" ");
  const m = blob.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  if (
    /\b(fridge|freezer|couch|sofa|wardrobe|mattress)\b/i.test(blob)
  ) {
    return 50;
  }
  return null;
}

export function courierTooHeavyError(params: {
  service_type?: string | null;
  required_vehicle?: VehicleType | string | null;
  details?: unknown;
}): string | null {
  if (params.service_type !== "courier") return null;

  const vehicle = String(params.required_vehicle || "").toLowerCase();
  if (vehicle === "bakkie" || vehicle === "truck") {
    return COURIER_TOO_HEAVY;
  }

  const kg = courierWeightKgFromDetails(params.details);
  if (kg != null && kg > COURIER_MAX_KG) return COURIER_TOO_HEAVY;
  return null;
}

export function assertCourierWithinLimit(params: {
  service_type?: string | null;
  required_vehicle?: VehicleType | string | null;
  details?: unknown;
}): void {
  const err = courierTooHeavyError(params);
  if (err) throw new Error(err);
}
