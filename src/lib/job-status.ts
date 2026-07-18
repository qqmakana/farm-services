import type { JobStatus } from "./types";

/** Open job waiting for a driver to accept (Uber "searching"). */
export function isSearchingStatus(status: JobStatus | string | null | undefined) {
  return status === "searching_driver" || status === "new";
}

/** Driver accepted — on the way. */
export function isConfirmedStatus(status: JobStatus | string | null | undefined) {
  return status === "confirmed" || status === "assigned";
}

export function isActiveTripStatus(status: JobStatus | string | null | undefined) {
  return (
    isSearchingStatus(status) ||
    isConfirmedStatus(status) ||
    status === "in_progress"
  );
}

/** Max exclusive offers before we tell the customer no drivers are available. */
export const MAX_DISPATCH_ATTEMPTS = 3;
