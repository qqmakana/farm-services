import { calculateFare } from "@/lib/fares";
import type { ServiceType } from "@/lib/types";
import { suggestVehicle } from "@/lib/vehicles";
import type { BookingExtraction, ConciergeQuote } from "./types";

/** Infer delivery size from free-text when the model omitted delivery_size. */
function inferDeliverySize(
  itemDetails: string | null | undefined,
): "small" | "medium" | "large" | "xl" | undefined {
  if (!itemDetails) return undefined;
  const t = itemDetails.toLowerCase();
  if (
    /\b(fridge|freezer|couch|wardrobe|sofa|bed|mattress|cow|cattle)\b/.test(t)
  ) {
    return "xl";
  }
  if (/\b(fridge|washing|machine|tv|furniture|heavy)\b/.test(t)) {
    return "large";
  }
  if (/\b(box|parcel|bag|crate|small)\b/.test(t)) {
    return "small";
  }
  return "medium";
}

export function extractionIsComplete(e: BookingExtraction): boolean {
  if (!e.service_type || !e.pickup_landmark || !e.dropoff_landmark) {
    return false;
  }
  if (
    (e.service_type === "delivery" || e.service_type === "farm") &&
    !e.item_details
  ) {
    return false;
  }
  return true;
}

function resolveAt(preferredTime: string | null): string | null {
  if (!preferredTime) return null;
  const lower = preferredTime.toLowerCase().trim();
  if (lower === "now" || lower === "asap" || lower === "immediately") {
    return null;
  }
  const d = new Date(preferredTime);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Mock / landmark quote: uses existing calculateFare (base + km when coords
 * exist). Without GPS we price the vehicle base (+ night surcharge if timed).
 */
export function quoteFromExtraction(
  extraction: BookingExtraction,
): ConciergeQuote | null {
  if (!extractionIsComplete(extraction)) return null;

  const service = extraction.service_type as ServiceType;
  const size =
    extraction.delivery_size ??
    (service === "delivery"
      ? inferDeliverySize(extraction.item_details)
      : undefined);

  const vehicle = suggestVehicle({
    service_type: service,
    delivery_size: size,
  });

  const at = resolveAt(extraction.preferred_time);
  const fare = calculateFare({ vehicle, at });

  return { vehicle, fare, extraction };
}
