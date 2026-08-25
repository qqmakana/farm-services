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
  driverLocation = null,
  center = null,
  cars = EMPTY_CARS,
  onSelect,
  cinematic = false,
  searchingRadar = false,
  className = "",
  pickupLabel = null,
  dropoffLabel = null,
  pickupEtaMins = null,
  paddingBottom = 40,
}: {
  pin?: Pin;
  dropoff?: Pin;
  driverLocation?: Pin;
  center?: { lat: number; lng: number } | null;
  cars?: JobMapPin[];
  onSelect?: (pin: { lat: number; lng: number }) => void;
  cinematic?: boolean;
  searchingRadar?: boolean;
  className?: string;
  pickupLabel?: string | null;
  dropoffLabel?: string | null;
  pickupEtaMins?: number | null;
  paddingBottom?: number;
}) {
  return (
    <RideMapCanvas
      className={className}
      center={center ?? DEFAULT_MAP_CENTER}
      pin={pin}
      dropoff={dropoff}
      driverLocation={driverLocation}
      cars={cars}
      onSelect={onSelect}
      cinematic={cinematic}
      searchingRadar={searchingRadar}
      variant="rider"
      pickupLabel={pickupLabel}
      dropoffLabel={dropoffLabel}
      pickupEtaMins={pickupEtaMins}
      paddingBottom={paddingBottom}
    />
  );
}
