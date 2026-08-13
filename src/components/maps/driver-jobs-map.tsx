"use client";

import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";
import {
  RideMapCanvas,
  type JobMapPin,
} from "@/components/maps/ride-map-canvas";

export type { JobMapPin };

export function DriverJobsMap({
  driverLocation,
  jobs,
  onSelectJob,
  className = "",
}: {
  driverLocation: { lat: number; lng: number } | null;
  jobs: JobMapPin[];
  onSelectJob: (id: string) => void;
  className?: string;
}) {
  return (
    <RideMapCanvas
      className={className}
      center={driverLocation ?? DEFAULT_MAP_CENTER}
      driverLocation={driverLocation}
      jobs={jobs}
      onSelectJob={onSelectJob}
      cinematic
    />
  );
}
