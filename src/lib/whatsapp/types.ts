import type { ServiceType, VehicleType } from "@/lib/types";
import type { FareBreakdown } from "@/lib/fares";

/** Structured booking fields extracted by the LLM. */
export type BookingExtraction = {
  service_type: ServiceType | null;
  pickup_landmark: string | null;
  dropoff_landmark: string | null;
  item_details: string | null;
  preferred_time: string | null;
  /** Optional hints the model may include */
  delivery_size?: "small" | "medium" | "large" | "xl" | null;
};

export type InboundWhatsAppMessage = {
  from: string;
  text: string;
  messageId?: string;
  timestamp?: string;
  /** "meta" | "mock" */
  source: "meta" | "mock";
  raw?: unknown;
};

export type ConciergeQuote = {
  vehicle: VehicleType;
  fare: FareBreakdown;
  extraction: BookingExtraction;
};

export type ConciergeResult = {
  inbound: InboundWhatsAppMessage;
  extraction: BookingExtraction | null;
  quote: ConciergeQuote | null;
  reply: string;
  ok: boolean;
  error?: string;
};
