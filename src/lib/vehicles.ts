import type { ServiceType, VehicleType } from "./types";
import type { LocalRideMode } from "./countries";

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  sedan: "Go (car)",
  bakkie: "Bakkie",
  truck: "Truck",
  motorcycle: "Motorcycle",
};

export const VEHICLE_EMOJI: Record<VehicleType, string> = {
  sedan: "🚗",
  bakkie: "🛻",
  truck: "🚚",
  motorcycle: "🏍️",
};

export const VEHICLE_BLURBS: Record<VehicleType, string> = {
  sedan: "People only — village ↔ town rides",
  bakkie: "Boxes, farm crates, small furniture, TVs",
  truck: "Fridges, couches, wardrobes, heavy loads",
  motorcycle: "Food delivery, documents, small bags",
};

export type ItemSize = "small" | "medium" | "large";

/** Fetch / Send size → vehicle. Shops catalog is always motorcycle. */
export const SIZE_VEHICLE: Record<ItemSize, VehicleType> = {
  small: "motorcycle",
  medium: "sedan",
  large: "bakkie",
};

export const FETCH_SEND_SIZES: {
  id: ItemSize;
  label: string;
  hint: string;
}[] = [
  { id: "small", label: "Small", hint: "Documents, bread" },
  { id: "medium", label: "Medium", hint: "Groceries bag" },
  { id: "large", label: "Large", hint: "Fridge, furniture" },
];

export function courierPackageSize(
  pkg: import("./types").CourierPackageType | null | undefined,
): ItemSize {
  if (pkg === "furniture" || pkg === "appliance") return "large";
  // Documents + groceries dispatch a car; sealed small bags stay motorcycle.
  if (pkg === "documents" || pkg === "medium_package") return "medium";
  return "small";
}

/** Local label for motorcycle-class modes (Boda, Okada, Auto, etc.). */
export function localModeLabel(mode: LocalRideMode | null | undefined): string {
  return mode?.label ?? VEHICLE_LABELS.motorcycle;
}

export function itemSizeFromWeight(
  weight?: "light" | "medium" | "heavy" | "extra_heavy" | null,
): ItemSize {
  if (weight === "light") return "small";
  if (weight === "heavy" || weight === "extra_heavy") return "large";
  return "medium";
}

export function itemSizeFromDeliverySize(
  size?: "small" | "medium" | "large" | "xl" | null,
): ItemSize {
  if (size === "small") return "small";
  if (size === "large" || size === "xl") return "large";
  return "medium";
}

/**
 * Trip / +Stop → sedan.
 * Shops catalog → motorcycle only.
 * Fetch & Send → motorcycle / sedan / bakkie by item size.
 */
export function suggestVehicle(params: {
  service_type: ServiceType;
  delivery_size?: "small" | "medium" | "large" | "xl";
  weight_category?: "light" | "medium" | "heavy" | "extra_heavy";
  /** Pay-in-app shop menu (not Fetch). */
  shop_catalog?: boolean;
}): VehicleType {
  if (params.service_type === "ride") return "sedan";
  if (params.shop_catalog) return "motorcycle";

  const size = params.delivery_size
    ? itemSizeFromDeliverySize(params.delivery_size)
    : itemSizeFromWeight(params.weight_category);

  if (params.service_type === "courier" || params.service_type === "delivery") {
    return SIZE_VEHICLE[size];
  }
  if (params.service_type === "farm") return "bakkie";
  return SIZE_VEHICLE[size];
}

/** Can this vehicle do this job? No sedan/bakkie fallback for motorcycle shops. */
export function vehicleFitsJob(
  driverVehicle: string,
  required: VehicleType,
): boolean {
  const v = driverVehicle.toLowerCase() as VehicleType;
  if (required === "sedan") return v === "sedan";
  if (required === "motorcycle") return v === "motorcycle";
  if (required === "bakkie") return v === "bakkie" || v === "truck";
  if (required === "truck") return v === "truck";
  return false;
}

export function defaultFeeForVehicle(vehicle: VehicleType): number {
  switch (vehicle) {
    case "sedan":
      return 50;
    case "motorcycle":
      return 35;
    case "bakkie":
      return 180;
    case "truck":
      return 450;
  }
}
