import { isNightWindow, parseScheduleAt } from "./night-fare";
import type { Driver, Job, ServiceType } from "./types";

export type JobNeeds = {
  night: boolean;
  heavy: boolean;
  village: boolean;
  scheduled: boolean;
};

export function jobNeedsFromJob(job: Pick<
  Job,
  "service_type" | "scheduled_for" | "created_at" | "dispatcher_notes"
>): JobNeeds {
  const when = job.scheduled_for
    ? parseScheduleAt(job.scheduled_for)
    : parseScheduleAt(job.created_at);
  const notes = (job.dispatcher_notes ?? "").toLowerCase();
  const night =
    isNightWindow(when) ||
    notes.includes("night ride") ||
    notes.includes("after-hours");
  const heavy =
    job.service_type === "delivery" ||
    job.service_type === "farm" ||
    job.service_type === "courier";
  const village =
    job.service_type === "ride" ||
    job.service_type === "farm" ||
    job.service_type === "courier";
  const scheduled = Boolean(job.scheduled_for);

  return { night, heavy, village, scheduled };
}

export function jobNeedsFromService(
  service: ServiceType,
  at: string | null | undefined,
  dispatcherNotes?: string | null,
): JobNeeds {
  return jobNeedsFromJob({
    service_type: service,
    scheduled_for: at ?? null,
    created_at: new Date().toISOString(),
    dispatcher_notes: dispatcherNotes ?? null,
  });
}

/** Soft filter: prefer opted-in drivers; fall back so jobs never stall. */
export function filterDriversByOptIn<
  T extends Pick<
    Driver,
    "prefer_night" | "prefer_heavy" | "prefer_village_routes"
  >,
>(candidates: T[], needs: JobNeeds): T[] {
  let pool = candidates;

  if (needs.night) {
    const nightOk = pool.filter((d) => d.prefer_night !== false);
    if (nightOk.length) pool = nightOk;
  }
  if (needs.heavy) {
    const heavyOk = pool.filter((d) => d.prefer_heavy !== false);
    if (heavyOk.length) pool = heavyOk;
  }
  if (needs.village) {
    const villageOk = pool.filter((d) => d.prefer_village_routes !== false);
    if (villageOk.length) pool = villageOk;
  }

  return pool;
}

/** Higher = better niche fit (then use distance as tie-breaker). */
export function driverNicheScore(
  driver: Pick<
    Driver,
    "prefer_night" | "prefer_heavy" | "prefer_village_routes"
  >,
  needs: JobNeeds,
): number {
  let score = 0;
  if (needs.night) score += driver.prefer_night !== false ? 100 : -40;
  if (needs.heavy) score += driver.prefer_heavy !== false ? 100 : -40;
  if (needs.village) score += driver.prefer_village_routes !== false ? 100 : -40;
  return score;
}

export function needsBadges(needs: JobNeeds): string[] {
  const badges: string[] = [];
  if (needs.night) badges.push("Night");
  if (needs.scheduled) badges.push("Scheduled");
  if (needs.heavy) badges.push("Heavy load");
  if (needs.village) badges.push("Village route");
  return badges;
}
