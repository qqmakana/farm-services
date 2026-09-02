"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { SimpleRideSheet } from "@/components/uber/simple-ride-sheet";
import { UberShell } from "@/components/uber/uber-shell";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";

function RideInner() {
  const params = useSearchParams();
  const presetDropoff = Boolean(params.get("toLat") && params.get("toLng"));
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const [dropoffPin, setDropoffPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchNonce, setSearchNonce] = useState(0);
  const [pickupLabel, setPickupLabel] = useState("Pickup");
  const [dropoffLabel, setDropoffLabel] = useState("");
  const [pickupEtaMins, setPickupEtaMins] = useState(3);

  return (
    <UberShell
      showTabBar={false}
      enterFromPeek
      initialSnap={presetDropoff ? "mid" : "full"}
      pin={pin}
      dropoffPin={dropoffPin}
      onMapPin={onMapPin}
      backHref="/"
      hideLocationHint
      pickupLabel={pickupLabel}
      dropoffLabel={dropoffLabel}
      pickupEtaMins={pickupEtaMins}
      onBack={() => {
        if (dropoffPin) {
          setDropoffPin(null);
          setSearchNonce((n) => n + 1);
          return;
        }
        window.location.assign("/");
      }}
      title=""
    >
      <SimpleRideSheet
        onPinChange={setPin}
        onDropoffPinChange={setDropoffPin}
        onMapLabelsChange={(next) => {
          setPickupLabel(next.pickup);
          setDropoffLabel(next.dropoff);
          setPickupEtaMins(next.etaMins);
        }}
        mapTapPin={mapTapPin}
        mapTapToken={mapTapToken}
        searchNonce={searchNonce}
      />
    </UberShell>
  );
}

export default function RidePage() {
  return (
    <BookingTabChrome hideTabBar>
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
