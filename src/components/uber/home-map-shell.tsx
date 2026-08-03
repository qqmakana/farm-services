"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { UberShell } from "@/components/uber/uber-shell";
import { ServiceHomeSheet } from "@/components/uber/service-home";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";
import {
  InstallHelpPanel,
  useInstallActions,
} from "@/components/install-share-bar";

/** Client home chrome — full-bleed map + Uber bottom sheet. */
export function HomeMapShell({ trust }: { trust: ReactNode }) {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const [dropoffPin, setDropoffPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const {
    standalone,
    installing,
    install,
    ios,
    helpOpen,
    setHelpOpen,
    note,
  } = useInstallActions();

  return (
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
      <div className="space-y-5">
        <ServiceHomeSheet
          mapTapPin={mapTapPin}
          mapTapToken={mapTapToken}
          onPinChange={setPin}
          onDropoffPinChange={setDropoffPin}
        />
        {trust}
        {!standalone ? (
          <button
            type="button"
            onClick={install}
            disabled={installing}
            className="ru-btn-book ru-btn-block"
          >
            {installing ? "Installing…" : "Install Village Ride"}
          </button>
        ) : null}
        {note ? (
          <p className="text-center text-xs font-semibold text-[var(--ru-success)]">
            {note}
          </p>
        ) : null}
        <p className="px-1 pb-2 text-center text-xs text-gray-500">
          <Link
            href="/onboarding?replay=1"
            className="font-semibold text-[var(--ru-ink)] underline underline-offset-2"
          >
            See feature tour
          </Link>
          {" · "}
          <Link
            href="/get-app"
            className="font-semibold text-[var(--ru-ink)] underline underline-offset-2"
          >
            Get the app
          </Link>
        </p>
      </div>
      {helpOpen ? (
        <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} />
      ) : null}
    </UberShell>
  );
}
