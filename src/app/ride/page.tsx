"use client";

import { Suspense, useState } from "react";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { RideSheet } from "@/components/uber/ride-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";

function RideInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const [dropoffPin, setDropoffPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  return (
    <UberShell
      showServicePills
      showTabBar
      initialSnap="mid"
      pin={pin}
      dropoffPin={dropoffPin}
      onMapPin={onMapPin}
      backHref="/"
      title="Village Ride"
    >
      <ClientErrorBoundary>
        <RideSheet
          onPinChange={setPin}
          onDropoffPinChange={setDropoffPin}
          mapTapPin={mapTapPin}
          mapTapToken={mapTapToken}
        />
      </ClientErrorBoundary>
    </UberShell>
  );
}

export default function RidePage() {
  return (
    <BookingTabChrome>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-[#F3F3F3] text-[var(--ru-ink)]">
            Loading ride…
          </div>
        }
      >
        <RideInner />
      </Suspense>
    </BookingTabChrome>
  );
}
