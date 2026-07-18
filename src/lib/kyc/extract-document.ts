import OpenAI from "openai";
import type { DocKind, DocumentExtraction } from "./types";

const EXTRACT_SYSTEM = `You are a KYC OCR assistant for Village Ride (South Africa).
Read the ID or driver's license image and extract structured fields.
Return ONLY valid JSON with keys:
- full_name (string|null)
- id_number (SA ID number if visible, else null)
- license_number (driver license / PDP number if visible, else null)
- expiry_date (YYYY-MM-DD if visible, else null)
- document_type (e.g. "smart_id", "green_id", "drivers_license", "unknown")
- raw_text_snippet (short OCR text, max 400 chars)
- confidence (0 to 1)

Rules:
- Do not invent values. Prefer null when unclear.
- Prefer the cardholder name as printed on the document.
- For SA smart IDs, id_number is the 13-digit number.
- expiry_date: use the license validity / card expiry when shown.`;

function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return (m?.[1] ?? t).trim();
}

function normalizeExtraction(
  kind: DocKind,
  raw: unknown,
): DocumentExtraction {
  const o =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const conf = Number(o.confidence);
  return {
    doc_kind: kind,
    full_name:
      typeof o.full_name === "string" && o.full_name.trim()
        ? o.full_name.trim()
        : null,
    id_number:
      typeof o.id_number === "string" && o.id_number.trim()
        ? o.id_number.replace(/\s/g, "")
        : null,
    license_number:
      typeof o.license_number === "string" && o.license_number.trim()
        ? o.license_number.trim()
        : null,
    expiry_date:
      typeof o.expiry_date === "string" && /^\d{4}-\d{2}-\d{2}/.test(o.expiry_date)
        ? o.expiry_date.slice(0, 10)
        : null,
    document_type:
      typeof o.document_type === "string" ? o.document_type : null,
    raw_text_snippet:
      typeof o.raw_text_snippet === "string"
        ? o.raw_text_snippet.slice(0, 400)
        : null,
    confidence: Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0.5,
  };
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Extract KYC fields from an image via OpenAI vision.
 * `imageUrl` must be reachable by OpenAI (signed Supabase URL is fine).
 */
export async function extractDocumentFromImage(params: {
  kind: DocKind;
  imageUrl: string;
  mimeType?: string | null;
}): Promise<DocumentExtraction> {
  if (!hasOpenAIKey()) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const mime = (params.mimeType || "").toLowerCase();
  if (mime.includes("pdf")) {
    return {
      doc_kind: params.kind,
      full_name: null,
      id_number: null,
      license_number: null,
      expiry_date: null,
      document_type: "pdf",
      raw_text_snippet: null,
      confidence: 0,
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Document kind: ${params.kind}. Extract fields from this South African identity / license document.`,
          },
          {
            type: "image_url",
            image_url: { url: params.imageUrl, detail: "high" },
          },
        ],
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI vision returned empty content");
  return normalizeExtraction(params.kind, JSON.parse(stripFence(content)));
}

/** Local/dev mock when no API key — marks for manual review. */
export function mockExtraction(kind: DocKind): DocumentExtraction {
  return {
    doc_kind: kind,
    full_name: null,
    id_number: null,
    license_number: null,
    expiry_date: null,
    document_type: "mock",
    raw_text_snippet: "Mock KYC — set OPENAI_API_KEY for real OCR",
    confidence: 0,
  };
}
