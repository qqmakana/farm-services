"use client";

import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";
import {
  RideMapCanvas,
  type JobMapPin,
} from "@/components/maps/ride-map-canvas";

type Pin = { lat: number; lng: number } | null;

const EMPTY_CARS: JobMapPin[] = [];

export function VillageMap({
  pin = null,
  dropoff = null,
  center = null,
  cars = EMPTY_CARS,
  onSelect,
  className = "",
}: {
  pin?: Pin;
  dropoff?: Pin;
  center?: { lat: number; lng: number } | null;
  cars?: JobMapPin[];
  onSelect?: (pin: { lat: number; lng: number }) => void;
  className?: string;
}) {
  return (
    <RideMapCanvas
      className={className}
      center={center ?? DEFAULT_MAP_CENTER}
      pin={pin}
      dropoff={dropoff}
      cars={cars}
      onSelect={onSelect}
      cinematic
    />
  );
}
