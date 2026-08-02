"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { HelpCircle, MapPin } from "lucide-react";
import { ShareAppButton } from "@/components/share-app-button";
import { useCountry } from "@/components/country/country-provider";
import { BRAND } from "@/lib/brand";

const VillageMap = dynamic(
  () =>
    import("@/components/maps/village-map").then((m) => m.VillageMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-sm text-[#000000]">
        Loading map…
      </div>
    ),
  },
);

export function UberShell({
  children,
  pin = null,
  onMapPin,
  backHref,
  title,
  showTabBar = false,
}: {
  children: React.ReactNode;
  pin?: { lat: number; lng: number } | null;
  /** Tap map → pin. Landmark text in the sheet stays active too. */
  onMapPin?: (pin: { lat: number; lng: number }) => void;
  backHref?: string;
  title?: string;
  /** Reserve space for the customer bottom tab bar (Home). */
  showTabBar?: boolean;
}) {
  const { country } = useCountry();
  const bottomInset = showTabBar
    ? "calc(4rem + env(safe-area-inset-bottom, 0px))"
    : "0px";

  return (
    <div
      className="ru-force-light fixed inset-x-0 top-0 z-[45] flex flex-col bg-[#F9FAFB] font-[family-name:var(--font-sans)] text-slate-900"
      style={{ bottom: bottomInset }}
    >
      {/* Top ~55%: interactive map */}
      <div className="relative h-[55%] min-h-[240px] w-full shrink-0">
        <VillageMap
          pin={pin}
          center={country.mapCenter}
          onSelect={onMapPin}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between p-3">
          <div className="pointer-events-auto flex items-center gap-2">
            {backHref ? (
              <Link
                href={backHref}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#000000] shadow-md transition active:scale-95"
                aria-label="Back"
              >
                ←
              </Link>
            ) : null}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3.5 pl-1.5 shadow-md backdrop-blur transition active:scale-95"
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
                <span className="block font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-[#000000]">
                  {title ?? BRAND.appName}
                </span>
                <span className="block text-[10px] font-medium tracking-wide text-[#000000]/70 uppercase">
                  {BRAND.company}
                </span>
              </span>
            </Link>
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5">
            <Link
              href="/help"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#000000] shadow-md backdrop-blur transition active:scale-95"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" aria-hidden />
            </Link>
            <div className="rounded-full bg-white/95 p-1 shadow-md [&_button]:rounded-full">
              <ShareAppButton />
            </div>
          </div>
        </div>
        {onMapPin ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[500] flex justify-center px-4">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md backdrop-blur">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {pin
                ? "Your location · tap map to adjust · add landmark below"
                : "Finding your location… · or tap map / type a landmark"}
            </p>
          </div>
        ) : null}
      </div>

      {/* Bottom ~45%: floating sheet */}
      <div className="relative z-[500] -mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white text-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 pt-3 ${
            showTabBar
              ? "pb-4"
              : "pb-[max(1rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
