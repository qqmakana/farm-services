"use client";

import { AppLink } from "@/components/ui/app-link";
import { useState, Suspense } from "react";
import { CalendarClock, Search } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { UberServiceCircle } from "@/components/customer/uber-service-circle";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import { type PlaceSuggestion } from "@/lib/suggestions";

type HomeMode = "ride" | "shops" | "courier";

const MODES: {
  id: HomeMode;
  label: string;
  href: string;
  src: string;
}[] = [
  { id: "ride", label: "Ride", href: "/", src: "/home/icons/car.png" },
  { id: "shops", label: "Shops", href: "/shops", src: "/home/icons/shops.png" },
  {
    id: "courier",
    label: "Courier",
    href: "/courier",
    src: "/home/icons/courier.png",
  },
];

/** Each icon opens its service immediately — no double-tap or filter-only taps. */
const HOME_SERVICES = [
  { href: "/", label: "For you", src: "/home/icons/car.png", testId: "service-circle-for-you" },
  { href: "/ride", label: "Trip", src: "/home/icons/car.png", testId: "service-circle-trip" },
  {
    href: "/ride?when=later",
    label: "Reserve",
    src: "/home/icons/car.png",
    testId: "service-circle-reserve",
  },
  { href: "/group", label: "Groups", src: "/home/icons/car.png", testId: "service-circle-groups" },
  {
    href: "/delivery",
    label: "Delivery",
    src: "/home/icons/courier.png",
    testId: "service-circle-delivery",
  },
  {
    href: "/courier",
    label: "Courier",
    src: "/home/icons/courier.png",
    testId: "service-circle-courier",
  },
  { href: "/farm", label: "Farm", src: "/home/icons/farm.png", testId: "service-circle-farm" },
  { href: "/shops", label: "Shops", src: "/home/icons/shops.png", testId: "service-circle-shops" },
] as const;

function placeQuery(place?: PlaceSuggestion): string {
  if (!place) return "";
  const q = new URLSearchParams();
  q.set("to", place.name);
  if (place.lat != null && Number.isFinite(place.lat)) {
    q.set("toLat", String(place.lat));
  }
  if (place.lng != null && Number.isFinite(place.lng)) {
    q.set("toLng", String(place.lng));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function hrefForTrip(place?: PlaceSuggestion): string {
  const extra = placeQuery(place);
  return extra ? `/ride${extra}` : "/ride";
}

export function UberHome() {
  const [mode, setMode] = useState<HomeMode>("ride");
  const [laterOpen, setLaterOpen] = useState(false);

  function goToPlace(place: PlaceSuggestion) {
    window.location.assign(hrefForTrip(place));
  }

  return (
    <main
      data-testid="uber-home"
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-sans)] text-black"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      <div
        data-testid="home-mode-tabs"
        className="flex items-end justify-around"
        role="tablist"
        aria-label="Ride, Shops, Courier"
      >
        {MODES.map((m) => {
          const selected = mode === m.id;
          const inner = (
            <>
              <span className="relative block h-10 w-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.src} alt="" className="h-10 w-10 object-contain" />
              </span>
              {m.label}
              {selected ? (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-black" />
              ) : null}
            </>
          );
          if (m.id === "ride") {
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMode("ride")}
                className={`uber-press relative flex min-h-14 flex-1 flex-col items-center gap-1 pb-2.5 text-[15px] ${
                  selected
                    ? "font-bold text-black"
                    : "font-medium text-[#6B6B6B]"
                }`}
              >
                {inner}
              </button>
            );
          }
          return (
            <AppLink
              key={m.id}
              href={m.href}
              role="tab"
              aria-selected={selected}
              onClick={() => setMode(m.id)}
              className={`uber-press relative flex min-h-14 flex-1 flex-col items-center gap-1 pb-2.5 text-[15px] ${
                selected
                  ? "font-bold text-black"
                  : "font-medium text-[#6B6B6B]"
              }`}
            >
              {inner}
            </AppLink>
          );
        })}
      </div>

      <div className="mt-5 flex items-center rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
        <AppLink
          href="/ride"
          data-testid="home-where-to"
          className="uber-press flex min-h-12 flex-1 items-center gap-3 text-left"
        >
          <Search
            className="h-5 w-5 shrink-0 text-[#6B6B6B]"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-[17px] font-normal text-[#A6A6A6]">
            Where to?
          </span>
        </AppLink>
        <span className="mx-1 h-8 w-px bg-[#EEEEEE]" aria-hidden />
        <button
          type="button"
          data-testid="home-later"
          onClick={() => setLaterOpen(true)}
          className="uber-press flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-[15px] font-medium text-black"
        >
          <CalendarClock className="h-4 w-4" strokeWidth={2} aria-hidden />
          Later
        </button>
      </div>

      <section className="relative z-10 mt-6" data-testid="home-chips">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.3px] text-black">
            For you
          </h2>
          <AppLink
            href="/services"
            className="uber-press flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-[#EEEEEE]"
            aria-label="All services"
          >
            <span className="text-lg leading-none text-black" aria-hidden>
              ›
            </span>
          </AppLink>
        </div>
        <div
          data-testid="service-circles"
          className="mt-4 flex gap-1 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label="Services"
        >
          {HOME_SERVICES.map((item, i) => (
            <div key={item.label} className="w-[76px] shrink-0">
              <UberServiceCircle
                href={item.href}
                label={item.label}
                src={item.src}
                testId={item.testId}
                size={52}
                primary={i === 0}
              />
            </div>
          ))}
        </div>
        <AppLink
          href="/courier"
          data-testid="service-circle-send-items"
          className="sr-only"
        >
          Send items
        </AppLink>
      </section>

      <SmartSuggestions filter="for-you" onSelectDestination={goToPlace} />

      <AppLink
        href="/ride"
        className="uber-press mt-4 block rounded-2xl bg-black px-4 py-3 text-white"
      >
        <span className="text-[13px] font-bold">20% off 10 trips</span>
        <span className="mt-0.5 block text-[12px] text-white/70">
          Village Pass · cash or PayPal
        </span>
      </AppLink>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
