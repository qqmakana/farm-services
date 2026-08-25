"use client";

import { Suspense, useState } from "react";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { SimpleRideSheet } from "@/components/uber/simple-ride-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function RideInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const [dropoffPin, setDropoffPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchNonce, setSearchNonce] = useState(0);

  return (
    <UberShell
      showTabBar
      enterFromPeek
      initialSnap="full"
      pin={pin}
      dropoffPin={dropoffPin}
      onMapPin={onMapPin}
      backHref="/"
      onBack={() => {
        if (dropoffPin) {
          setDropoffPin(null);
          setSearchNonce((n) => n + 1);
          return;
        }
        window.location.assign("/");
      }}
      title="Plan your ride"
    >
      <SimpleRideSheet
        onPinChange={setPin}
        onDropoffPinChange={setDropoffPin}
        mapTapPin={mapTapPin}
        mapTapToken={mapTapToken}
        searchNonce={searchNonce}
      />
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
