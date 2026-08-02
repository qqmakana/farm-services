"use client";

import { Suspense } from "react";
import { CourierSheet } from "@/components/uber/courier-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function CourierInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  return (
    <UberShell pin={pin} onMapPin={onMapPin} backHref="/" title="Courier">
      <CourierSheet
        onPinChange={setPin}
        mapTapPin={mapTapPin}
        mapTapToken={mapTapToken}
      />
    </UberShell>
  );
}

export default function CourierPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
          Loading courier…
        </div>
      }
    >
      <CourierInner />
    </Suspense>
  );
}
