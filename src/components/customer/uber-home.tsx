"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
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

type HomeMode = "ride" | "shops" | "courier";

const MODES: { id: HomeMode; label: string; href: string }[] = [
  { id: "ride", label: "Ride", href: "/" },
  { id: "shops", label: "Shops", href: "/shops" },
  { id: "courier", label: "Courier", href: "/courier" },
];

const FOR_YOU: {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: string;
}[] = [
  { href: "/ride", label: "Trip", Icon: Car, badge: "20%" },
  { href: "/shops", label: "Shops", Icon: UtensilsCrossed },
  { href: "/courier", label: "Send items", Icon: Package, badge: "20%" },
  { href: "/farm", label: "Farm", Icon: Tractor },
];

const FALLBACK_RECENTS = [
  "Bassonia Seventh-day Adventist Church",
  "Engen Meyersdal Convenience Centre",
];

export function UberHome() {
  const router = useRouter();
  const [mode, setMode] = useState<HomeMode>("ride");
  const [laterOpen, setLaterOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>(FALLBACK_RECENTS);

  useEffect(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) return;
    void listJobsByCustomerPhone(guest.phone)
      .then((jobs) => {
        const places = jobs
          .map((j) => j.dropoff_landmark || j.pickup_landmark)
          .filter(Boolean);
        const unique = [...new Set(places)].slice(0, 2);
        if (unique.length) {
          const padded = [
            ...unique,
            ...FALLBACK_RECENTS.filter((p) => !unique.includes(p)),
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
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white p-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] font-sans text-[#0a0a0a]"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      <div
        data-testid="home-mode-tabs"
        className="flex items-center gap-4"
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
              className={
                selected
                  ? "uber-press rounded-full bg-[#0a0a0a] px-5 py-2 text-sm font-semibold text-white"
                  : "uber-press px-1 py-2 text-sm font-medium text-[#71717a]"
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          data-testid="home-where-to"
          onClick={openWhere}
          className="uber-press flex min-h-12 flex-1 items-center justify-between rounded-[9999px] bg-[#f4f4f5] py-1 pl-4 pr-2 text-left"
        >
          <span className="flex items-center gap-3">
            <Search
              className="h-5 w-5 shrink-0 text-[#0a0a0a]"
              strokeWidth={ICON}
              aria-hidden
            />
            <span className="text-base font-medium text-[#71717a]">
              Where to?
            </span>
          </span>
        </button>
        <button
          type="button"
          data-testid="home-later"
          onClick={() => setLaterOpen(true)}
          className="uber-press flex items-center gap-2 rounded-[9999px] bg-[#f4f4f5] px-4 py-3 text-xs font-bold text-[#0a0a0a]"
        >
          <Clock className="h-4 w-4" strokeWidth={ICON} aria-hidden />
          Later
        </button>
      </div>

      <DriveSignupCard variant="compact" className="mt-4" />

      <ul className="mt-4 flex flex-col gap-4" data-testid="home-recents">
        {recents.map((place) => (
          <li key={place}>
            <button
              type="button"
              onClick={() =>
                router.push(`/ride?to=${encodeURIComponent(place)}`)
              }
              className="uber-press flex w-full items-center justify-between rounded-[9999px] bg-[#f4f4f5] px-4 py-4 text-left"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Clock
                  className="h-5 w-5 shrink-0 text-[#0a0a0a]"
                  strokeWidth={ICON}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-[#0a0a0a]">
                    {place}
                  </span>
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[#71717a]"
                strokeWidth={ICON}
              />
            </button>
          </li>
        ))}
      </ul>

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-[#0a0a0a]">For you</h2>
        <div
          data-testid="service-circles"
          className="mt-4 flex gap-4 overflow-x-auto pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#f02d3a] px-2 py-[1px] text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#f4f4f5] text-[#0a0a0a]">
                <Icon className="h-7 w-7" strokeWidth={ICON} aria-hidden />
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

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-[#0a0a0a]">
          More ways to use Village Ride
        </h2>
        <Link
          href="/ride?when=later"
          className="uber-press relative mt-4 block overflow-hidden rounded-[24px]"
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
