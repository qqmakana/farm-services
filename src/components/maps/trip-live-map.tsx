"use client";

import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";
import { RideMapCanvas } from "@/components/maps/ride-map-canvas";

type Pin = { lat: number; lng: number } | null;

export function TripLiveMap({
  pickup = null,
  dropoff = null,
  driver = null,
  className = "",
}: {
  pickup?: Pin;
  dropoff?: Pin;
  driver?: Pin;
  className?: string;
}) {
  return (
    <RideMapCanvas
      className={className}
      center={pickup ?? driver ?? dropoff ?? DEFAULT_MAP_CENTER}
      pin={pickup}
      dropoff={dropoff}
      driverLocation={driver}
      cinematic
    />
  );
}
