"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { UberShell } from "@/components/uber/uber-shell";
import { ServiceHomeSheet } from "@/components/uber/service-home";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { useBookingMapPin } from "@/components/uber/use-booking-map-pin";
import { useInstallActions } from "@/components/install-share-bar";

/** Client home chrome — auto-GPS map + landmark both active. */
export function HomeMapShell({ trust }: { trust: ReactNode }) {
  const { pin, setPin, mapTapPin, mapTapToken, onMapPin } = useBookingMapPin();
  const { standalone, installing, install } = useInstallActions();

  return (
    <UberShell showTabBar pin={pin} onMapPin={onMapPin}>
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>
      <div className="space-y-5">
        <ServiceHomeSheet
          mapTapPin={mapTapPin}
          mapTapToken={mapTapToken}
          onPinChange={setPin}
        />
        {trust}
        {!standalone ? (
          <button
            type="button"
            onClick={install}
            disabled={installing}
            className="ru-btn ru-btn-primary ru-btn-block"
          >
            {installing ? "Starting…" : "Install Village Ride"}
          </button>
        ) : null}
        <p className="px-1 text-center text-xs text-slate-500">
          <Link
            href="/onboarding?replay=1"
            className="font-semibold text-black underline underline-offset-2"
          >
            See feature tour
          </Link>
          {" · "}
          <Link
            href="/get-app"
            className="font-semibold text-black underline underline-offset-2"
          >
            Get the app
          </Link>
        </p>
      </div>
    </UberShell>
  );
}
