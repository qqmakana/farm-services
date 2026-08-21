"use client";

import { Suspense, useState, type ReactNode } from "react";
import { UberShell } from "@/components/uber/uber-shell";
import { ServiceHomeSheet } from "@/components/uber/service-home";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

/** Full-bleed map + sheet — Uber Home. */
export function HomeMapShell({ trust }: { trust?: ReactNode }) {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const [dropoffPin, setDropoffPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  return (
    <div data-testid="uber-home">
      <UberShell
        showTabBar
        showServicePills
        pin={pin}
        dropoffPin={dropoffPin}
        onMapPin={onMapPin}
      >
        <Suspense fallback={null}>
          <CaptureReferral />
        </Suspense>
        <ServiceHomeSheet
          mapTapPin={mapTapPin}
          mapTapToken={mapTapToken}
          onPinChange={setPin}
          onDropoffPinChange={setDropoffPin}
        />
        {trust}
      </UberShell>
    </div>
  );
}
