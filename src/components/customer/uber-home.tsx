"use client";

import { AppLink } from "@/components/ui/app-link";
import { useState, Suspense } from "react";
import { CalendarClock, Search } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import {
  ArtReserve,
  UberServiceTile,
} from "@/components/customer/uber-service-tile";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import { HomeWhereSearch } from "@/components/customer/home-where-search";
import { HomeInstallCard } from "@/components/customer/home-install-card";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";
import type { PlaceSuggestion } from "@/lib/suggestions";

/** Four primary circles — Uber Home density. */
const HOME_SERVICES = [
  {
    href: "/ride",
    label: "Trip",
    src: "/home/icons/car.png",
    testId: "service-circle-trip",
    badge: "20%",
  },
  {
    href: "/delivery",
    label: "Fetch",
    src: "/home/icons/courier.png",
    testId: "service-circle-delivery",
    knockoutWhite: true,
  },
  {
    href: "/shops",
    label: "Shops",
    src: "/home/icons/shops.png",
    testId: "service-circle-shops",
    knockoutWhite: true,
  },
  {
    href: "/ride?when=later",
    label: "Reserve",
    art: <ArtReserve />,
    testId: "service-circle-reserve",
    badge: "Promo",
  },
] as const;

const MORE_WAYS = [
  {
    href: "/courier",
    title: "Send a package",
    sub: "Documents or small items",
    src: "/home/icons/courier.png",
    testId: "service-circle-courier",
  },
  {
    href: "/farm",
    title: "Farm transport",
    sub: "Move produce or livestock",
    src: "/home/icons/farm.png",
    testId: "service-circle-farm",
  },
  {
    href: "/ride?stop=1",
    title: "Need a ride?",
    sub: "Trip to campus or town — one stop with you in the car",
    src: "/home/icons/car.png",
    testId: "home-trip-stop",
  },
] as const;

function placeQuery(
  place?: PlaceSuggestion,
  opts?: { whenLater?: boolean },
): string {
  if (!place) return "";
  const q = new URLSearchParams();
  q.set("to", place.name);
  if (place.lat != null && Number.isFinite(place.lat)) {
    q.set("toLat", String(place.lat));
  }
  if (place.lng != null && Number.isFinite(place.lng)) {
    q.set("toLng", String(place.lng));
  }
  if (opts?.whenLater) q.set("when", "later");
  try {
    const raw = sessionStorage.getItem("vr_last_gps_v1");
    if (raw) {
      const gps = JSON.parse(raw) as { lat?: number; lng?: number };
      if (
        Number.isFinite(gps.lat) &&
        Number.isFinite(gps.lng) &&
        gps.lat != null &&
        gps.lng != null
      ) {
        const label =
          sessionStorage.getItem("vr_last_pickup_label_v1") ||
          "Current location";
        q.set("from", label);
        q.set("fromLat", String(gps.lat));
        q.set("fromLng", String(gps.lng));
      }
    }
  } catch {
    /* private mode */
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function hrefForTrip(
  place?: PlaceSuggestion,
  opts?: { whenLater?: boolean },
): string {
  const extra = placeQuery(place, opts);
  return extra ? `/ride${extra}` : "/ride";
}

export function UberHome() {
  const [laterOpen, setLaterOpen] = useState(false);
  const [whereOpen, setWhereOpen] = useState(false);

  function goToPlace(
    place: PlaceSuggestion,
    opts?: { whenLater?: boolean },
  ) {
    window.location.assign(hrefForTrip(place, opts));
  }

  return (
    <main
      data-testid="uber-home"
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-sans)] text-[#111111] vr-page-enter"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      <HomeInstallCard />

      {/* Launching badge */}
      <p
        data-testid="home-launching-badge"
        className="mb-3 inline-flex items-center rounded-full bg-[#ECFDF3] px-3 py-1 text-[12px] font-semibold text-[#05944F]"
      >
        Launching end of September
      </p>

      {/* Uber-style Where to? + Later */}
      <div className="mt-1 flex h-14 items-center gap-2 rounded-full bg-[#EEEEEE] pl-5 pr-2">
        <button
          type="button"
          data-testid="home-where-to"
          onClick={() => setWhereOpen(true)}
          className="uber-press flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Search
            className="h-5 w-5 shrink-0 text-[#111111]"
            strokeWidth={2.5}
            aria-hidden
          />
          <span className="truncate text-[22px] font-bold tracking-[-0.02em] text-[#111111]">
            Where to?
          </span>
        </button>
        <button
          type="button"
          data-testid="home-later"
          onClick={() => setLaterOpen(true)}
          className="uber-press flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[15px] font-semibold text-[#6B6B6B] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        >
          <CalendarClock className="h-4 w-4" strokeWidth={2} aria-hidden />
          Later
        </button>
      </div>

      <HomeWhereSearch
        open={whereOpen}
        onClose={() => setWhereOpen(false)}
        onPick={goToPlace}
      />

      {/* Service circles */}
      <section className="mt-6" data-testid="home-chips">
        <div
          data-testid="service-circles"
          className="grid grid-cols-4 gap-2"
          role="navigation"
          aria-label="Services"
        >
          {HOME_SERVICES.map((item) => (
            <UberServiceTile
              key={item.label}
              href={item.href}
              label={item.label}
              src={"src" in item ? item.src : undefined}
              art={"art" in item ? item.art : undefined}
              badge={"badge" in item ? item.badge : undefined}
              knockoutWhite={
                "knockoutWhite" in item ? item.knockoutWhite : false
              }
              tileClassName="!rounded-full !bg-[#EEEEEE] aspect-square"
              testId={item.testId}
            />
          ))}
        </div>
        {/* E2E / a11y aliases kept off-layout */}
        <AppLink href="/" data-testid="service-circle-for-you" className="sr-only">
          For you
        </AppLink>
        <AppLink
          href="/ride?stop=1"
          data-testid="service-circle-trip-stop"
          className="sr-only"
        >
          Trip + stop
        </AppLink>
        <AppLink
          href="/courier"
          data-testid="service-circle-send-items"
          className="sr-only"
        >
          Send items
        </AppLink>
        <AppLink
          href="/ride?seats=2"
          data-testid="service-circle-groups"
          className="sr-only"
        >
          People
        </AppLink>
        <div data-testid="home-mode-tabs" className="sr-only" aria-hidden>
          Ride Shops Send
        </div>
      </section>

      {/* Promo — Uber split card */}
      <AppLink
        href="/ride"
        className="uber-press uber-press-card mt-6 flex min-h-[7.5rem] overflow-hidden rounded-[16px] bg-[#F3EDE4]"
      >
        <span className="flex flex-1 flex-col justify-center px-4 py-4">
          <span className="text-[17px] font-bold leading-snug tracking-[-0.02em] text-[#111111]">
            You have a promo to use
          </span>
          <span className="mt-1 text-[14px] font-medium text-[#6B6B6B]">
            20% off 10 trips · Village Pass
          </span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/home/icons/car.png"
          alt=""
          className="h-full w-[42%] object-contain object-right-bottom p-2"
        />
      </AppLink>

      <SmartSuggestions
        filter="for-you"
        showNearby={false}
        onSelectDestination={goToPlace}
      />

      {/* More ways — Uber horizontal cards */}
      <section className="mt-7">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#111111]">
          More ways to use Village Ride
        </h2>
        <div className="vr-hide-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          {MORE_WAYS.map((card) => (
            <AppLink
              key={card.href}
              href={card.href}
              data-testid={card.testId}
              className="uber-press uber-press-card flex w-[9.5rem] shrink-0 flex-col overflow-hidden rounded-[16px] bg-[#F6F6F6]"
            >
              <span className="flex h-28 items-center justify-center bg-[#EEEEEE]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.src}
                  alt=""
                  className="h-16 w-16 object-contain mix-blend-multiply"
                />
              </span>
              <span className="px-3 py-3">
                <span className="block text-[15px] font-bold text-[#111111]">
                  {card.title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[#6B6B6B]">
                  {card.sub}
                </span>
              </span>
            </AppLink>
          ))}
        </div>
      </section>

      <DriveSignupCard variant="compact" className="mt-6" />

      <AppLink
        href="/account"
        className="uber-press mt-4 block rounded-[16px] bg-[#F6F6F6] px-4 py-4 text-[#111111]"
      >
        <span className="text-[15px] font-bold">Refer a friend, get R 50</span>
        <span className="mt-0.5 block text-[13px] text-[#6B6B6B]">
          Share your VR code from Account
        </span>
      </AppLink>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
