"use client";

import { Suspense, useState } from "react";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { DeliverySheet } from "@/components/uber/delivery-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function DeliveryInner() {
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
      title="Village Delivery"
    >
      <DeliverySheet
        onPinChange={setPin}
        onDropoffPinChange={setDropoffPin}
        mapTapPin={mapTapPin}
        mapTapToken={mapTapToken}
      />
    </UberShell>
  );
}

export default function DeliveryPage() {
  return (
    <BookingTabChrome>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
            Loading delivery…
          </div>
        }
      >
        <DeliveryInner />
      </Suspense>
    </BookingTabChrome>
  );
}
