"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { CalendarClock, ChevronRight, Search } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import {
  bookingPathForTab,
  homeTabLabel,
  homeTabOpensPage,
  type HomeFeedTab,
  type PlaceSuggestion,
} from "@/lib/suggestions";

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

const FEED_TABS: {
  id: HomeFeedTab;
  label: string;
  src: string;
}[] = [
  { id: "for-you", label: "For you", src: "/home/icons/car.png" },
  { id: "trip", label: "Trip", src: "/home/icons/car.png" },
  { id: "reserve", label: "Reserve", src: "/home/icons/car.png" },
  { id: "groups", label: "Groups", src: "/home/icons/car.png" },
  { id: "delivery", label: "Delivery", src: "/home/icons/courier.png" },
  { id: "courier", label: "Courier", src: "/home/icons/courier.png" },
  { id: "farm", label: "Farm", src: "/home/icons/farm.png" },
  { id: "shops", label: "Shops", src: "/home/icons/shops.png" },
];

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

function hrefForTab(tab: HomeFeedTab, place?: PlaceSuggestion): string {
  const base = bookingPathForTab(tab);
  const extra = placeQuery(place);
  if (!extra) return base;
  if (tab === "shops" || tab === "groups") return base;
  return base.includes("?") ? `${base}&${extra.slice(1)}` : `${base}${extra}`;
}

export function UberHome() {
  const router = useRouter();
  const [mode, setMode] = useState<HomeMode>("ride");
  const [activeTab, setActiveTab] = useState<HomeFeedTab>("for-you");
  const [laterOpen, setLaterOpen] = useState(false);

  const bookingTab = activeTab === "for-you" ? "trip" : activeTab;
  const whereHref = hrefForTab(bookingTab);
  const openServiceHref = bookingPathForTab(bookingTab);

  function onFeedTabClick(tab: HomeFeedTab) {
    if (homeTabOpensPage(tab)) {
      router.push(bookingPathForTab(tab));
      return;
    }
    if (activeTab === tab && tab !== "for-you") {
      router.push(bookingPathForTab(tab));
      return;
    }
    setActiveTab(tab);
  }

  function goToPlace(place: PlaceSuggestion) {
    router.push(hrefForTab(bookingTab, place));
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
        <Link
          href={whereHref}
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
        </Link>
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
            {homeTabLabel(activeTab)}
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
          className="mt-4 flex gap-2 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="For you"
        >
          {FEED_TABS.map((tab, i) => {
            const selected = activeTab === tab.id;
            const testId =
              tab.id === "courier"
                ? "service-circle-courier"
                : `service-circle-${tab.label.toLowerCase().replace(/\s+/g, "-")}`;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                data-testid={testId}
                data-primary={i === 0 ? "true" : "false"}
                onClick={() => onFeedTabClick(tab.id)}
                className={`uber-press relative z-10 flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-2 ${
                  selected ? "bg-black text-white" : "bg-[#F3F3F3] text-black"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ${
                    selected ? "bg-white/15" : "bg-white"
                  }`}
                >
                  <Image
                    src={tab.src}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 object-contain"
                  />
                </span>
                <span className="w-[64px] text-center text-[12px] font-semibold">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Alias so older tests / analytics still find Send items */}
        <button
          type="button"
          data-testid="service-circle-send-items"
          className="sr-only"
          onClick={() => setActiveTab("courier")}
        >
          Send items
        </button>
      </section>

      <SmartSuggestions
        filter={activeTab}
        onSelectDestination={goToPlace}
      />

      {activeTab !== "for-you" && !homeTabOpensPage(activeTab) ? (
        <Link
          href={openServiceHref}
          data-testid="home-open-service"
          className="uber-press mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-black px-5 text-[17px] font-medium text-white"
        >
          Open {homeTabLabel(activeTab)}
        </Link>
      ) : null}

      {activeTab === "for-you" ? (
        <Link
          href="/ride"
          className="uber-press mt-4 block rounded-2xl bg-black px-4 py-3 text-white"
        >
          <span className="text-[13px] font-bold">20% off 10 trips</span>
          <span className="mt-0.5 block text-[12px] text-white/70">
            Village Pass · cash or PayPal
          </span>
        </Link>
      ) : null}

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
