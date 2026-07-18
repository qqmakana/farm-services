import { nameMatchScore } from "./name-match";
import type { DocumentExtraction, KycDecision } from "./types";

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function isExpired(ymd: string | null): boolean {
  if (!ymd) return false;
  return ymd < todayYmd();
}

function licenseNumbersClose(a: string, b: string): boolean {
  const na = a.replace(/[\s-]/g, "").toUpperCase();
  const nb = b.replace(/[\s-]/g, "").toUpperCase();
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Decide auto-approve vs needs_review from OCR extractions + profile.
 */
export function decideKyc(params: {
  profileName: string;
  statedLicenseNumber?: string | null;
  extractions: DocumentExtraction[];
  openaiAvailable: boolean;
}): KycDecision {
  const issues: string[] = [];
  const { profileName, statedLicenseNumber, extractions, openaiAvailable } =
    params;

  if (!openaiAvailable) {
    issues.push("OPENAI_API_KEY missing — AI scan skipped; manual review required");
  }

  if (extractions.length === 0) {
    issues.push("No document images available to scan");
    return {
      status: "needs_review",
      id_verified: false,
      issues,
      name_on_docs: null,
      id_number: null,
      license_expiry: null,
      name_match_score: 0,
      extractions,
    };
  }

  for (const e of extractions) {
    if (e.document_type === "pdf") {
      issues.push(
        `${e.doc_kind}: PDF uploaded — upload a clear photo (JPEG/PNG) for AI KYC`,
      );
    } else if (
      openaiAvailable &&
      e.document_type !== "mock" &&
      e.confidence < 0.35 &&
      !e.full_name
    ) {
      issues.push(`${e.doc_kind}: OCR confidence too low`);
    }
  }

  const names = extractions
    .map((e) => e.full_name)
    .filter((n): n is string => Boolean(n?.trim()));
  const bestName =
    names.sort(
      (a, b) =>
        nameMatchScore(profileName, b) - nameMatchScore(profileName, a),
    )[0] ?? null;

  const score = nameMatchScore(profileName, bestName);
  if (!bestName) {
    issues.push("Could not read a name from uploaded documents");
  } else if (score < 0.6) {
    issues.push(
      `Name mismatch: profile "${profileName}" vs document "${bestName}" (score ${(score * 100).toFixed(0)}%)`,
    );
  }

  const idNumber =
    extractions.map((e) => e.id_number).find((v) => v?.trim()) ?? null;

  const licenseExpiry =
    extractions
      .filter((e) => e.doc_kind === "license" || e.expiry_date)
      .map((e) => e.expiry_date)
      .find((v) => v) ?? null;

  if (licenseExpiry && isExpired(licenseExpiry)) {
    issues.push(`Document expired on ${licenseExpiry}`);
  }

  const extractedLicense =
    extractions.map((e) => e.license_number).find((v) => v?.trim()) ?? null;
  if (
    statedLicenseNumber?.trim() &&
    extractedLicense &&
    !licenseNumbersClose(statedLicenseNumber, extractedLicense)
  ) {
    issues.push(
      `License number mismatch: entered "${statedLicenseNumber}" vs document "${extractedLicense}"`,
    );
  }

  // Hard fail → needs_review (never auto-reject; ops decide)
  const blocking = issues.some(
    (i) =>
      i.includes("Name mismatch") ||
      i.includes("expired") ||
      i.includes("OPENAI_API_KEY") ||
      i.includes("No document") ||
      i.includes("Could not read a name") ||
      i.includes("PDF uploaded") ||
      i.includes("License number mismatch") ||
      i.includes("OCR confidence"),
  );

  const usable =
    bestName &&
    score >= 0.6 &&
    !isExpired(licenseExpiry) &&
    openaiAvailable &&
    !blocking;

  if (usable) {
    return {
      status: "auto_approved",
      id_verified: true,
      issues: issues.length ? issues : ["AI KYC passed"],
      name_on_docs: bestName,
      id_number: idNumber,
      license_expiry: licenseExpiry,
      name_match_score: score,
      extractions,
    };
  }

  return {
    status: "needs_review",
    id_verified: false,
    issues: issues.length ? issues : ["Flagged for manual admin review"],
    name_on_docs: bestName,
    id_number: idNumber,
    license_expiry: licenseExpiry,
    name_match_score: score,
    extractions,
  };
}
