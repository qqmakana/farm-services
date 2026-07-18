import { createAdminClient } from "@/lib/supabase/admin";
import type { Driver } from "@/lib/types";
import {
  extractDocumentFromImage,
  hasOpenAIKey,
  mockExtraction,
} from "./extract-document";
import type { DocKind, DocumentExtraction, KycDecision } from "./types";
import { decideKyc } from "./verify";

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  return "image/jpeg";
}

async function signedUrlFor(path: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("rr-driver-docs")
    .createSignedUrl(path, 600);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not sign document URL");
  }
  return data.signedUrl;
}

async function extractOne(
  kind: DocKind,
  path: string | null | undefined,
): Promise<DocumentExtraction | null> {
  if (!path || path.startsWith("mock://")) {
    return path ? mockExtraction(kind) : null;
  }
  if (!hasOpenAIKey()) {
    return mockExtraction(kind);
  }
  const url = await signedUrlFor(path);
  return extractDocumentFromImage({
    kind,
    imageUrl: url,
    mimeType: mimeFromPath(path),
  });
}

export function decisionToDriverPatch(decision: KycDecision) {
  return {
    kyc_status: decision.status,
    kyc_checked_at: new Date().toISOString(),
    kyc_name_on_docs: decision.name_on_docs,
    kyc_id_number: decision.id_number,
    kyc_license_expiry: decision.license_expiry,
    kyc_issues: decision.issues,
    kyc_raw: {
      name_match_score: decision.name_match_score,
      extractions: decision.extractions,
    },
    id_verified: decision.id_verified,
  };
}

/**
 * Run AI KYC for a driver after document upload.
 * Safe to call from `after()` — never throws to the caller path if wrapped.
 */
export async function runDriverKyc(driverId: string): Promise<KycDecision> {
  const admin = createAdminClient();

  await admin
    .from("rr_drivers")
    .update({ kyc_status: "pending" })
    .eq("id", driverId);

  const { data: driver, error } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("id", driverId)
    .single();

  if (error || !driver) {
    throw new Error(error?.message ?? "Driver not found for KYC");
  }

  const typed = driver as Driver;
  const extractions: DocumentExtraction[] = [];

  try {
    const idEx = await extractOne("id", typed.id_doc_url);
    if (idEx) extractions.push(idEx);
    const licEx = await extractOne("license", typed.license_doc_url);
    if (licEx) extractions.push(licEx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[kyc] extraction failed", driverId, message);
    const decision: KycDecision = {
      status: "needs_review",
      id_verified: false,
      issues: [`AI scan failed: ${message}`],
      name_on_docs: null,
      id_number: null,
      license_expiry: null,
      name_match_score: 0,
      extractions,
    };
    await admin
      .from("rr_drivers")
      .update(decisionToDriverPatch(decision))
      .eq("id", driverId);
    return decision;
  }

  const decision = decideKyc({
    profileName: typed.full_name,
    statedLicenseNumber: typed.license_number,
    extractions,
    openaiAvailable: hasOpenAIKey(),
  });

  console.log("[kyc] decision", {
    driverId,
    status: decision.status,
    id_verified: decision.id_verified,
    issues: decision.issues,
    name_match_score: decision.name_match_score,
  });

  await admin
    .from("rr_drivers")
    .update(decisionToDriverPatch(decision))
    .eq("id", driverId);

  return decision;
}

/** Local mock KYC (no OpenAI / no storage). */
export function runMockDriverKyc(driver: Driver): KycDecision {
  const extractions: DocumentExtraction[] = [];
  if (driver.id_doc_url) extractions.push(mockExtraction("id"));
  if (driver.license_doc_url) extractions.push(mockExtraction("license"));

  return decideKyc({
    profileName: driver.full_name,
    statedLicenseNumber: driver.license_number,
    extractions,
    openaiAvailable: false,
  });
}
