import type { ServiceType, VehicleType } from "./types";

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  sedan: "Go (car)",
  bakkie: "Bakkie",
  truck: "Truck",
};

export const VEHICLE_BLURBS: Record<VehicleType, string> = {
  sedan: "People only — village ↔ town rides",
  bakkie: "Boxes, farm crates, small furniture, TVs",
  truck: "Fridges, couches, wardrobes, heavy loads",
};

/** SA Uber-style rule: people → car; goods → bakkie/truck. */
export function suggestVehicle(params: {
  service_type: ServiceType;
  delivery_size?: "small" | "medium" | "large" | "xl";
}): VehicleType {
  if (params.service_type === "ride") return "sedan";
  if (params.service_type === "courier") {
    return params.delivery_size === "medium" ? "bakkie" : "sedan";
  }
  if (params.service_type === "farm") return "bakkie";
  if (params.delivery_size === "xl" || params.delivery_size === "large") {
    return "truck";
  }
  return "bakkie";
}

/** Can this vehicle do this job? Truck can cover bakkie; bakkie cannot do truck-only. */
export function vehicleFitsJob(
  driverVehicle: string,
  required: VehicleType,
): boolean {
  const v = driverVehicle.toLowerCase() as VehicleType;
  if (required === "sedan") return v === "sedan";
  if (required === "bakkie") return v === "bakkie" || v === "truck";
  if (required === "truck") return v === "truck";
  return false;
}

export function defaultFeeForVehicle(vehicle: VehicleType): number {
  switch (vehicle) {
    case "sedan":
      return 50;
    case "bakkie":
      return 180;
    case "truck":
      return 450;
  }
}
