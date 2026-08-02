"use client";

import { Suspense } from "react";
import { RideSheet } from "@/components/uber/ride-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function RideInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  return (
    <UberShell
      pin={pin}
      onMapPin={onMapPin}
      backHref="/"
      title="Village Ride"
    >
      <RideSheet
        onPinChange={setPin}
        mapTapPin={mapTapPin}
        mapTapToken={mapTapToken}
      />
    </UberShell>
  );
}

export default function RidePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
          Loading ride…
        </div>
      }
    >
      <RideInner />
    </Suspense>
  );
}
