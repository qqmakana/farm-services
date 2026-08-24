"use client";

import { Suspense, useState } from "react";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { CourierSheet } from "@/components/uber/courier-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";

function CourierInner() {
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
      title="Courier"
    >
      <ClientErrorBoundary>
        <CourierSheet
          onPinChange={setPin}
          onDropoffPinChange={setDropoffPin}
          mapTapPin={mapTapPin}
          mapTapToken={mapTapToken}
        />
      </ClientErrorBoundary>
    </UberShell>
  );
}

export default function CourierPage() {
  return (
    <BookingTabChrome>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
            Loading courier…
          </div>
        }
      >
        <CourierInner />
      </Suspense>
    </BookingTabChrome>
  );
}
