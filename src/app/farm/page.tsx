"use client";

import { Suspense, useState } from "react";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { SimpleGoodsSheet } from "@/components/uber/simple-goods-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function FarmInner() {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const [dropoffPin, setDropoffPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  return (
    <UberShell
      showServicePills={false}
      showTabBar={false}
      enterFromPeek
      initialSnap="peek"
      pin={pin}
      dropoffPin={dropoffPin}
      onMapPin={onMapPin}
      backHref="/"
      title="Farm Connect"
    >
      <SimpleGoodsSheet
        service="farm"
        onPinChange={setPin}
        onDropoffPinChange={setDropoffPin}
        mapTapPin={mapTapPin}
        mapTapToken={mapTapToken}
      />
    </UberShell>
  );
}

export default function FarmPage() {
  return (
    <BookingTabChrome hideTabBar>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
            Loading farm…
          </div>
        }
      >
        <FarmInner />
      </Suspense>
    </BookingTabChrome>
  );
}
