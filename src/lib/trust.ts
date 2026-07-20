import type { Driver } from "./types";

export type VerificationStatus = "pending" | "verified" | "rejected";

/** True only after ops manually approved ID + photos. */
export function isDriverTrustVerified(driver: Pick<Driver, "verification_status" | "id_verified">): boolean {
  if (driver.verification_status === "verified") return true;
  // Legacy rows before TRUST_SAFETY.sql
  if (!driver.verification_status && driver.id_verified) return true;
  return false;
}

export function driverHasRequiredPhotos(
  driver: Pick<
    Driver,
    | "id_doc_url"
    | "selfie_url"
    | "vehicle_front_url"
    | "vehicle_side_url"
  >,
): boolean {
  return Boolean(
    driver.id_doc_url &&
      driver.selfie_url &&
      driver.vehicle_front_url &&
      driver.vehicle_side_url,
  );
}

export function driverCanGoOnline(driver: Driver): {
  ok: boolean;
  reason?: string;
} {
  if (driver.approval_status === "rejected") {
    return { ok: false, reason: "Your application was rejected." };
  }
  if (driver.approval_status != null && driver.approval_status !== "approved") {
    return { ok: false, reason: "Your hire application is still pending." };
  }
  if (!driver.is_active || driver.suspended_at) {
    return {
      ok: false,
      reason:
        driver.suspend_reason ||
        "Your account is suspended. Contact Village Ride support.",
    };
  }
  if (!driver.code_of_conduct_accepted_at) {
    return {
      ok: false,
      reason: "Accept the Driver Code of Conduct before going online.",
    };
  }
  if (!driverHasRequiredPhotos(driver)) {
    return {
      ok: false,
      reason:
        "Upload ID, selfie, and vehicle photos before going online.",
    };
  }
  if (!isDriverTrustVerified(driver)) {
    if (driver.verification_status === "rejected") {
      return {
        ok: false,
        reason:
          driver.verification_note ||
          "Verification was rejected. Re-upload clearer photos or contact support.",
      };
    }
    return {
      ok: false,
      reason:
        "Pending ID verification — Village Ride must approve your photos before you go online.",
    };
  }
  return { ok: true };
}

export const DRIVER_CONDUCT_RULES = [
  "No overcharging — charge only the in-app fare.",
  "Be respectful to every customer.",
  "No illegal goods or weapons on trips.",
  "Follow traffic laws and drive safely.",
  "Cancel only in genuine emergencies; communicate clearly.",
  "Keep your vehicle roadworthy and registration current.",
  "Do not share customer personal details.",
] as const;
