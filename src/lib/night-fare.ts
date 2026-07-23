import type { ServiceType } from "./types";

/** 18:00–05:59 local time = after-hours / night window. */
export const NIGHT_SURCHARGE_PCT = 40;

export function isNightWindow(when: Date = new Date()): boolean {
  const hour = when.getHours();
  return hour >= 18 || hour < 6;
}

export function parseScheduleAt(
  scheduledFor: string | null | undefined,
): Date {
  if (!scheduledFor) return new Date();
  const d = new Date(scheduledFor);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Labels for matching drivers who opted into taxi-proof niches. */
export function driverOptInLabels(
  service: ServiceType,
  isNight: boolean,
): string[] {
  const labels: string[] = [];
  if (isNight) labels.push("Night Shifts");
  if (
    service === "delivery" ||
    service === "farm" ||
    service === "courier"
  ) {
    labels.push("Heavy Loads");
  }
  if (service === "ride" || service === "farm" || service === "courier") {
    labels.push("Direct Village Routes");
  }
  if (labels.length === 0) labels.push("Direct Village Routes");
  return labels;
}

export function driverOptInNote(
  service: ServiceType,
  isNight: boolean,
): string {
  const labels = driverOptInLabels(service, isNight);
  return `This trip will be sent to drivers who have opted in for ${labels.join(" / ")}.`;
}
