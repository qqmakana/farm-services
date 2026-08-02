"use client";

import { Suspense } from "react";
import { DeliverySheet } from "@/components/uber/delivery-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function DeliveryInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  return (
    <UberShell
      pin={pin}
      onMapPin={onMapPin}
      backHref="/"
      title="Village Delivery"
    >
      <DeliverySheet
        onPinChange={setPin}
        mapTapPin={mapTapPin}
        mapTapToken={mapTapToken}
      />
    </UberShell>
  );
}

export default function DeliveryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
          Loading delivery…
        </div>
      }
    >
      <DeliveryInner />
    </Suspense>
  );
}
