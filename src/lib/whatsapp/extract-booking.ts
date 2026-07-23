import OpenAI from "openai";
import type { ServiceType } from "@/lib/types";
import type { BookingExtraction } from "./types";

export const BOOKING_SYSTEM_PROMPT = `You are a booking assistant for Village Ride, a rural SA transport app. Extract the following from the user's message: service_type (ride, delivery, farm, courier), pickup_landmark, dropoff_landmark, item_details (if delivery/farm/courier), and preferred_time. Return ONLY a valid JSON object.

Rules:
- service_type: "ride" for passengers; "delivery" for bulky shop goods/furniture; "courier" for person-to-person packages (keys, gifts, documents, Marketplace items); "farm" for farm produce/crates/livestock feed. Use null if unclear.
- pickup_landmark / dropoff_landmark: landmark names people use in villages/towns (shop, taxi rank, clinic, farm name). Not street numbers. null if missing.
- item_details: short description for delivery/farm/courier; null for rides.
- preferred_time: natural language or ISO-ish string the user said (e.g. "tonight 8pm", "tomorrow morning", "now"); null if ASAP/unspecified.
- delivery_size: optional "small" | "medium" | "large" | "xl" when goods size is implied; else null.
- Do not invent landmarks. Prefer null over guessing.
- Output JSON keys exactly: service_type, pickup_landmark, dropoff_landmark, item_details, preferred_time, delivery_size.`;

const SERVICES: ServiceType[] = ["ride", "delivery", "farm", "courier"];
const SIZES = ["small", "medium", "large", "xl"] as const;

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function normalizeExtraction(raw: unknown): BookingExtraction {
  const o =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const st = typeof o.service_type === "string" ? o.service_type.toLowerCase() : null;
  const size =
    typeof o.delivery_size === "string"
      ? o.delivery_size.toLowerCase()
      : null;

  return {
    service_type: SERVICES.includes(st as ServiceType)
      ? (st as ServiceType)
      : null,
    pickup_landmark:
      typeof o.pickup_landmark === "string" && o.pickup_landmark.trim()
        ? o.pickup_landmark.trim()
        : null,
    dropoff_landmark:
      typeof o.dropoff_landmark === "string" && o.dropoff_landmark.trim()
        ? o.dropoff_landmark.trim()
        : null,
    item_details:
      typeof o.item_details === "string" && o.item_details.trim()
        ? o.item_details.trim()
        : null,
    preferred_time:
      typeof o.preferred_time === "string" && o.preferred_time.trim()
        ? o.preferred_time.trim()
        : null,
    delivery_size: SIZES.includes(size as (typeof SIZES)[number])
      ? (size as (typeof SIZES)[number])
      : null,
  };
}

/** Parse model text into BookingExtraction; throws if not JSON. */
export function parseBookingJson(content: string): BookingExtraction {
  const cleaned = stripCodeFence(content);
  const parsed = JSON.parse(cleaned) as unknown;
  return normalizeExtraction(parsed);
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Call OpenAI to extract booking fields. Returns null fields if key missing
 * or the model response cannot be parsed — caller handles clarification.
 */
export async function extractBookingFromText(
  userText: string,
): Promise<BookingExtraction> {
  if (!hasOpenAIKey()) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: BOOKING_SYSTEM_PROMPT },
      { role: "user", content: userText },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return parseBookingJson(content);
}
