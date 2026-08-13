"use client";

import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";
import { RideMapCanvas } from "@/components/maps/ride-map-canvas";

type Pin = { lat: number; lng: number } | null;

export function VillageMap({
  pin = null,
  dropoff = null,
  center = null,
  onSelect,
  className = "",
}: {
  pin?: Pin;
  dropoff?: Pin;
  center?: { lat: number; lng: number } | null;
  onSelect?: (pin: { lat: number; lng: number }) => void;
  className?: string;
}) {
  return (
    <RideMapCanvas
      className={className}
      center={center ?? DEFAULT_MAP_CENTER}
      pin={pin}
      dropoff={dropoff}
      onSelect={onSelect}
      cinematic
    />
  );
}
