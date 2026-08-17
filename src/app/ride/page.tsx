"use client";

import { Suspense, useState } from "react";
import { RideSheet } from "@/components/uber/ride-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function RideInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const [dropoffPin, setDropoffPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  return (
    <UberShell
      showServicePills
      initialSnap="mid"
      pin={pin}
      dropoffPin={dropoffPin}
      onMapPin={onMapPin}
      backHref="/"
      title="Village Ride"
    >
      <RideSheet
        onPinChange={setPin}
        onDropoffPinChange={setDropoffPin}
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
        <div className="flex min-h-dvh items-center justify-center bg-[#F3F3F3] text-[var(--ru-ink)]">
          Loading ride…
        </div>
      }
    >
      <RideInner />
    </Suspense>
  );
}
