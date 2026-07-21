import type { Driver } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

/** Human label for vehicle card, e.g. "White Toyota Hilux" or "Bakkie". */
export function vehicleDisplayLabel(
  driver: Pick<
    Driver,
    | "vehicle_type"
    | "vehicle_color"
    | "vehicle_make"
    | "vehicle_model"
  >,
): string {
  const parts = [
    driver.vehicle_color?.trim(),
    driver.vehicle_make?.trim(),
    driver.vehicle_model?.trim(),
  ].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return VEHICLE_LABELS[driver.vehicle_type] ?? driver.vehicle_type;
}

export function driverInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}
