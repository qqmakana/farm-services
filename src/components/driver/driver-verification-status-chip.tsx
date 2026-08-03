"use client";

import type { Driver } from "@/lib/types";
import { isDriverTrustVerified } from "@/lib/trust";

export type DriverVerificationUiStatus = "pending" | "verified" | "rejected";

export function getDriverVerificationUiStatus(
  driver: Pick<Driver, "verification_status" | "id_verified">,
): DriverVerificationUiStatus {
  if (isDriverTrustVerified(driver)) return "verified";
  if (driver.verification_status === "rejected") return "rejected";
  return "pending";
}

/**
 * Account status chip — maps pending / verified / rejected to Earn-First copy.
 */
export function DriverVerificationStatusChip({
  driver,
}: {
  driver: Pick<Driver, "verification_status" | "id_verified">;
}) {
  const status = getDriverVerificationUiStatus(driver);

  if (status === "verified") {
    return (
      <div data-testid="driver-verification-status">
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
          Verified &amp; Active
        </span>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div data-testid="driver-verification-status" className="space-y-1">
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
          Action Required
        </span>
        <p className="text-xs leading-snug text-red-700">
          Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="driver-verification-status" className="space-y-1">
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
        Pending Verification
      </span>
      <p className="text-xs leading-snug text-yellow-800/90">
        You can browse jobs, but cannot accept paid trips yet.
      </p>
    </div>
  );
}

export const VERIFICATION_BLOCK_MESSAGE =
  "Please complete your verification to accept paid trips.";
