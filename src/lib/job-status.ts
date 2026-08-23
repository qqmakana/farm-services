import type { JobDetails, JobStatus } from "./types";

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

export function driverArrivedAt(
  job: { details?: unknown } | null | undefined,
): string | null {
  const details = job?.details;
  if (!details || typeof details !== "object") return null;
  const at = (details as { driver_arrived_at?: unknown }).driver_arrived_at;
  return typeof at === "string" && at.length > 0 ? at : null;
}

export function driverHasArrived(
  job: { details?: unknown } | null | undefined,
): boolean {
  return Boolean(driverArrivedAt(job));
}

export function mergeDriverArrivedDetails(
  details: JobDetails | null | undefined,
  at: string,
): JobDetails {
  const base = details && typeof details === "object" ? details : {};
  return { ...base, driver_arrived_at: at };
}
