import { VEHICLE_LABELS } from "@/lib/vehicles";
import { extractionIsComplete } from "./quote-from-extraction";
import type { BookingExtraction, ConciergeQuote } from "./types";

export function buildClarificationReply(extraction: BookingExtraction | null): string {
  const missing: string[] = [];
  if (!extraction?.service_type) {
    missing.push("service (ride, delivery, farm, or courier)");
  }
  if (!extraction?.pickup_landmark) missing.push("pickup landmark");
  if (!extraction?.dropoff_landmark) missing.push("dropoff landmark");
  if (
    extraction?.service_type === "delivery" ||
    extraction?.service_type === "farm" ||
    extraction?.service_type === "courier"
  ) {
    if (!extraction.item_details) missing.push("what you are sending");
  }

  if (missing.length === 0 && extraction && !extractionIsComplete(extraction)) {
    missing.push("a few more details");
  }

  const list =
    missing.length > 0
      ? missing.join(", ")
      : "pickup landmark, dropoff landmark, and service type";

  return [
    "Hi! I'm the Village Ride WhatsApp assistant.",
    `I still need: ${list}.`,
    'Example: "Delivery — fridge from Shoprite Mthatha to Qunu clinic tomorrow 10am".',
  ].join(" ");
}

export function buildQuoteReply(quote: ConciergeQuote): string {
  const { vehicle, fare, extraction } = quote;
  const vehicleLabel = VEHICLE_LABELS[vehicle];
  const pickup = extraction.pickup_landmark!;
  const dropoff = extraction.dropoff_landmark!;
  const price = Number(fare.fee_amount).toFixed(0);
  const night = fare.is_night_ride
    ? ` (includes ${fare.night_surcharge_pct}% night surcharge)`
    : "";

  return `Thanks! I found a ${vehicleLabel} for your trip from ${pickup} to ${dropoff}. The estimated price is R${price}${night}. Reply YES to confirm.`;
}

export function buildErrorReply(): string {
  return "Sorry — I couldn't read that booking just now. Please try again in a moment, or book on https://village-ride.vercel.app";
}
