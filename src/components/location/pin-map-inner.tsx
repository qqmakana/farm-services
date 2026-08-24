"use client";

import { RideMapCanvas } from "@/components/maps/ride-map-canvas";

export function PinMapInner({
  lat,
  lng,
  hasPin,
  onPick,
}: {
  lat: number;
  lng: number;
  hasPin: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  const pin = hasPin ? { lat, lng } : null;
  return (
    <div className="h-48 w-full overflow-hidden rounded-xl border border-[var(--ru-line)]">
      <RideMapCanvas
        center={{ lat, lng }}
        pin={pin}
        cinematic={false}
        variant="rider"
        onSelect={({ lat: nextLat, lng: nextLng }) => onPick(nextLat, nextLng)}
      />
    </div>
  );
}
