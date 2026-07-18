export type KycStatus =
  | "none"
  | "pending"
  | "auto_approved"
  | "needs_review"
  | "rejected"
  | "manual_approved";

export type DocKind = "id" | "license";

/** Fields extracted from a single document image via vision OCR. */
export type DocumentExtraction = {
  doc_kind: DocKind;
  full_name: string | null;
  id_number: string | null;
  license_number: string | null;
  expiry_date: string | null; // YYYY-MM-DD when possible
  document_type: string | null;
  raw_text_snippet: string | null;
  confidence: number; // 0–1
};

export type KycDecision = {
  status: Exclude<KycStatus, "none" | "pending">;
  id_verified: boolean;
  issues: string[];
  name_on_docs: string | null;
  id_number: string | null;
  license_expiry: string | null;
  name_match_score: number;
  extractions: DocumentExtraction[];
};
