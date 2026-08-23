"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { CalendarClock, ChevronRight, Search } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import type { PlaceSuggestion } from "@/lib/suggestions";

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

const FOR_YOU: {
  href: string;
  label: string;
  src: string;
  badge?: string;
}[] = [
  { href: "/ride", label: "Trip", src: "/home/icons/car.png", badge: "20%" },
  { href: "/ride?when=later", label: "Reserve", src: "/home/icons/car.png" },
  { href: "/group", label: "Groups", src: "/home/icons/car.png" },
  { href: "/farm", label: "Farm", src: "/home/icons/farm.png" },
  { href: "/shops", label: "Shops", src: "/home/icons/shops.png" },
  { href: "/courier", label: "Send items", src: "/home/icons/courier.png" },
];

export function UberHome() {
  const router = useRouter();
  const [mode, setMode] = useState<HomeMode>("ride");
  const [laterOpen, setLaterOpen] = useState(false);

  function openWhere() {
    if (mode === "shops") router.push("/shops");
    else if (mode === "courier") router.push("/courier");
    else router.push("/ride");
  }

  function goToPlace(place: PlaceSuggestion) {
    if (mode === "shops") {
      router.push("/shops");
      return;
    }
    if (mode === "courier") {
      router.push("/courier");
      return;
    }
    const q = new URLSearchParams();
    q.set("to", place.name);
    if (place.lat != null && Number.isFinite(place.lat)) {
      q.set("toLat", String(place.lat));
    }
    if (place.lng != null && Number.isFinite(place.lng)) {
      q.set("toLng", String(place.lng));
    }
    router.push(`/ride?${q.toString()}`);
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
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setMode(m.id);
                if (m.id !== "ride") router.push(m.href);
              }}
              className={`uber-press relative flex min-h-14 flex-1 flex-col items-center gap-1 pb-2.5 text-[15px] ${
                selected
                  ? "font-bold text-black"
                  : "font-medium text-[#6B6B6B]"
              }`}
            >
              <span className="relative h-10 w-10">
                <Image
                  src={m.src}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </span>
              {m.label}
              {selected ? (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-black" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
        <button
          type="button"
          data-testid="home-where-to"
          onClick={openWhere}
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
        </button>
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

      <SmartSuggestions onSelectDestination={goToPlace} />

      <section className="relative z-10 mt-6" data-testid="home-chips">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.3px] text-black">
            For you
          </h2>
          <Link
            href="/services"
            className="uber-press flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-[#EEEEEE]"
            aria-label="All services"
          >
            <ChevronRight className="h-4 w-4 text-black" strokeWidth={2} />
          </Link>
        </div>
        <div
          data-testid="service-circles"
          className="mt-4 flex gap-5 overflow-x-auto pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label="For you"
        >
          {FOR_YOU.map(({ href, label, src, badge }, i) => (
            <Link
              key={label}
              href={href}
              data-testid={`service-circle-${label.toLowerCase().replace(/\s+/g, "-")}`}
              data-primary={i === 0 ? "true" : "false"}
              className="uber-press relative z-10 flex w-[72px] shrink-0 flex-col items-center"
            >
              {badge ? (
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-[4px] bg-[#CB4040] px-1.5 py-[2px] text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
              <span className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full bg-[#EEEEEE]">
                <Image
                  src={src}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              </span>
              <span className="mt-2 text-center text-[13px] font-medium text-black">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
