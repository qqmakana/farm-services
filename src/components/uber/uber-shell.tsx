"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { HelpCircle, MapPin } from "lucide-react";
import { ShareAppButton } from "@/components/share-app-button";
import { ServicePills } from "@/components/uber/service-pills";
import { useCountry } from "@/components/country/country-provider";
import { BRAND } from "@/lib/brand";

const VillageMap = dynamic(
  () =>
    import("@/components/maps/village-map").then((m) => m.VillageMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#F3F3F3] text-sm text-[var(--ru-muted)]">
        Loading map…
      </div>
    ),
  },
);

export function UberShell({
  children,
  pin = null,
  dropoffPin = null,
  onMapPin,
  backHref,
  title,
  showTabBar = false,
  showServicePills = false,
  floatingSearch = null,
  stickyAction = null,
}: {
  children: ReactNode;
  pin?: { lat: number; lng: number } | null;
  dropoffPin?: { lat: number; lng: number } | null;
  /** Tap map → pin. Landmark text in the sheet stays active too. */
  onMapPin?: (pin: { lat: number; lng: number }) => void;
  backHref?: string;
  title?: string;
  /** Reserve space for the customer bottom tab bar (Home). */
  showTabBar?: boolean;
  /** Uber-style service category pills over the map */
  showServicePills?: boolean;
  /** Optional floating “Where to?” card over the map */
  floatingSearch?: ReactNode;
  /** Pinned bottom CTA inside the sheet (Book Now) */
  stickyAction?: ReactNode;
}) {
  const { country } = useCountry();
  const bottomInset = showTabBar
    ? "calc(4rem + env(safe-area-inset-bottom, 0px))"
    : "0px";

  return (
    <div
      className="ru-force-light fixed top-0 left-1/2 z-[45] w-full max-w-md -translate-x-1/2 overflow-hidden bg-[#F3F3F3] font-[family-name:var(--font-sans)] text-[var(--ru-ink)]"
      style={{ bottom: bottomInset }}
    >
      {/* Full-screen map foundation */}
      <div className="absolute inset-0 z-0">
        <VillageMap
          pin={pin}
          dropoff={dropoffPin}
          center={country.mapCenter}
          onSelect={onMapPin}
        />
      </div>

      {/* Top chrome + optional Where-to bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {backHref ? (
              <Link
                href={backHref}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--ru-ink)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition active:scale-[0.98]"
                aria-label="Back"
              >
                ←
              </Link>
            ) : null}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3.5 pl-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur transition active:scale-[0.98]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full bg-black object-cover"
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold tracking-tight text-[var(--ru-ink)]">
                  {title ?? BRAND.appName}
                </span>
                <span
                  data-testid="country-indicator"
                  className="block text-[10px] font-medium tracking-wide text-[var(--ru-muted)] uppercase"
                >
                  {country.flag} {country.currencySymbol}
                  {country.currency}
                </span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href="/help"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[var(--ru-ink)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur transition active:scale-[0.98]"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" aria-hidden />
            </Link>
            <div className="rounded-full bg-white/95 p-1 shadow-[0_4px_24px_rgba(0,0,0,0.08)] [&_button]:rounded-full">
              <ShareAppButton />
            </div>
          </div>
        </div>
        {showServicePills ? (
          <div className="pointer-events-auto mt-3">
            <ServicePills />
          </div>
        ) : null}
        {floatingSearch ? (
          <div className="pointer-events-auto mt-3">{floatingSearch}</div>
        ) : null}
      </div>

      {onMapPin && !floatingSearch && !showServicePills ? (
        <div className="pointer-events-none absolute inset-x-0 top-[5.5rem] z-10 flex justify-center px-4">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md backdrop-blur">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {pin
              ? "Your location · tap map to adjust"
              : "Finding your location…"}
          </p>
        </div>
      ) : null}

      {/* Native-style bottom sheet over the map */}
      <div
        data-testid="bottom-sheet"
        className="ru-sheet absolute inset-x-0 bottom-0 z-20 flex max-h-[72vh] flex-col overflow-hidden transition-all duration-300 ease-out"
        style={{
          boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
        }}
      >
        <div
          data-testid="drag-handle"
          className="ru-sheet-handle shrink-0 !my-3 !h-1.5 !w-12 !bg-gray-300"
        />
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 ${
            stickyAction ? "pb-2" : showTabBar ? "pb-4" : "pb-[max(1rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {children}
        </div>
        {stickyAction ? (
          <div className="shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {stickyAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}
