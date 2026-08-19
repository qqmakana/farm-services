"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  Car,
  ChevronRight,
  Clock,
  Package,
  Search,
  Tractor,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { Suspense } from "react";
import { getGuestProfile } from "@/lib/guest-profile";
import { listJobsByCustomerPhone } from "@/lib/actions";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";

const ICON = 2;
const GLOSS =
  "bg-white shadow-[0_8px_28px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]";

type HomeMode = "ride" | "shops" | "courier";

const MODES: {
  id: HomeMode;
  label: string;
  href: string;
  Icon: LucideIcon;
}[] = [
  { id: "ride", label: "Ride", href: "/", Icon: Car },
  { id: "shops", label: "Shops", href: "/shops", Icon: UtensilsCrossed },
  { id: "courier", label: "Courier", href: "/courier", Icon: Package },
];

const FOR_YOU: {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: string;
}[] = [
  { href: "/ride", label: "Trip", Icon: Car, badge: "20%" },
  { href: "/shops", label: "Shops", Icon: UtensilsCrossed },
  { href: "/courier", label: "Send items", Icon: Package },
  { href: "/farm", label: "Farm", Icon: Tractor, badge: "Promo" },
];

const FALLBACK_RECENTS = [
  {
    title: "Bassonia Seventh-day Adventist Church",
    subtitle: "Bassonia, Johannesburg",
  },
  {
    title: "Engen Meyersdal Convenience Centre",
    subtitle: "Meyersdal, Alberton",
  },
];

export function UberHome() {
  const router = useRouter();
  const [mode, setMode] = useState<HomeMode>("ride");
  const [laterOpen, setLaterOpen] = useState(false);
  const [recents, setRecents] = useState(FALLBACK_RECENTS);

  useEffect(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) return;
    void listJobsByCustomerPhone(guest.phone)
      .then((jobs) => {
        const places = jobs
          .map((j) => ({
            title: j.dropoff_landmark || j.pickup_landmark,
            subtitle: j.pickup_landmark && j.dropoff_landmark
              ? `From ${j.pickup_landmark}`
              : "Recent trip",
          }))
          .filter((p) => p.title);
        const unique = [
          ...new Map(places.map((p) => [p.title, p])).values(),
        ].slice(0, 2);
        if (unique.length) {
          const padded = [
            ...unique,
            ...FALLBACK_RECENTS.filter(
              (p) => !unique.some((u) => u.title === p.title),
            ),
          ].slice(0, 2);
          setRecents(padded);
        }
      })
      .catch(() => undefined);
  }, []);

  function openWhere() {
    if (mode === "shops") router.push("/shops");
    else if (mode === "courier") router.push("/courier");
    else router.push("/ride");
  }

  return (
    <main
      data-testid="uber-home"
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-[#f3f3f3] px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] font-sans text-[#0a0a0a]"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      <div
        data-testid="home-mode-tabs"
        className="flex items-end justify-around gap-2"
        role="tablist"
        aria-label="Ride, Shops, Courier"
      >
        {MODES.map((m) => {
          const selected = mode === m.id;
          const TabIcon = m.Icon;
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
              className={`uber-press relative flex min-h-12 flex-1 flex-col items-center gap-1 pb-2 text-xs font-semibold ${
                selected ? "text-[#0a0a0a]" : "text-[#71717a]"
              }`}
            >
              <span className="relative">
                <TabIcon
                  className="h-7 w-7"
                  strokeWidth={selected ? 2.25 : 1.75}
                  aria-hidden
                />
                {m.id === "shops" ? (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#06c167]" />
                ) : null}
              </span>
              {m.label}
              {selected ? (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        className={`mt-4 flex items-center gap-2 rounded-[9999px] py-1.5 pl-4 pr-1.5 ${GLOSS}`}
      >
        <button
          type="button"
          data-testid="home-where-to"
          onClick={openWhere}
          className="uber-press flex min-h-11 flex-1 items-center gap-3 text-left"
        >
          <Search
            className="h-5 w-5 shrink-0 text-[#0a0a0a]"
            strokeWidth={ICON}
            aria-hidden
          />
          <span className="text-[17px] font-medium text-[#71717a]">
            Where to?
          </span>
        </button>
        <button
          type="button"
          data-testid="home-later"
          onClick={() => setLaterOpen(true)}
          className="uber-press flex h-10 shrink-0 items-center gap-1.5 rounded-[9999px] bg-[#f3f3f3] px-3.5 text-sm font-bold text-[#0a0a0a]"
        >
          <Calendar className="h-4 w-4" strokeWidth={ICON} aria-hidden />
          Later
        </button>
      </div>

      <ul
        className={`mt-4 overflow-hidden rounded-[24px] ${GLOSS}`}
        data-testid="home-recents"
      >
        {recents.map((place, i) => (
          <li key={place.title}>
            {i > 0 ? <div className="mx-4 h-px bg-[#eee]" /> : null}
            <button
              type="button"
              onClick={() =>
                router.push(`/ride?to=${encodeURIComponent(place.title)}`)
              }
              className="uber-press flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f3f3]">
                <Clock
                  className="h-4 w-4 text-[#0a0a0a]"
                  strokeWidth={ICON}
                  aria-hidden
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-[#0a0a0a]">
                  {place.title}
                </span>
                <span className="mt-0.5 block truncate text-sm font-medium text-[#71717a]">
                  {place.subtitle}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[#c4c4c4]"
                strokeWidth={ICON}
              />
            </button>
          </li>
        ))}
      </ul>

      <DriveSignupCard variant="compact" className="mt-4" />

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0a0a0a]">For you</h2>
          <Link
            href="/services"
            className="uber-press flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            aria-label="All services"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
        <div
          data-testid="service-circles"
          className="mt-4 flex gap-5 overflow-x-auto pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label="For you"
        >
          {FOR_YOU.map(({ href, label, Icon, badge }, i) => (
            <Link
              key={label}
              href={href}
              data-testid={`service-circle-${label.toLowerCase().replace(/\s+/g, "-")}`}
              data-primary={i === 0 ? "true" : "false"}
              className="uber-press relative flex w-[72px] shrink-0 flex-col items-center"
            >
              {badge ? (
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-[#f02d3a] px-1.5 py-[1px] text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                <Icon className="h-8 w-8" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mt-2 text-center text-xs font-medium text-[#0a0a0a]">
                {label}
              </span>
            </Link>
          ))}
        </div>
        <div data-testid="home-chips" className="sr-only">
          For you
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold text-[#0a0a0a]">
          More ways to use Village Ride
        </h2>
        <Link
          href="/ride?when=later"
          className={`uber-press relative mt-4 block overflow-hidden rounded-[24px] ${GLOSS}`}
        >
          <span className="relative block aspect-[16/7] w-full bg-[#f4f4f5]">
            <Image
              src="/home/banner-night.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 28rem) 100vw, 28rem"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 to-transparent" />
            <span className="absolute bottom-3 left-4 text-base font-semibold text-white">
              Reserve a night ride
            </span>
          </span>
        </Link>
      </section>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
