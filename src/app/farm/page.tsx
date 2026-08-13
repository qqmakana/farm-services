"use client";

import { Suspense } from "react";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { FarmSheet } from "@/components/uber/farm-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function FarmInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  return (
    <BookingTabChrome>
      <UberShell
        showTabBar
        showServicePills
        initialSnap="mid"
        pin={pin}
        onMapPin={onMapPin}
        backHref="/"
        title="Farm Connect"
      >
        <FarmSheet
          onPinChange={setPin}
          mapTapPin={mapTapPin}
          mapTapToken={mapTapToken}
        />
      </UberShell>
    </BookingTabChrome>
  );
}

export default function FarmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
          Loading farm…
        </div>
      }
    >
      <FarmInner />
    </Suspense>
  );
}
