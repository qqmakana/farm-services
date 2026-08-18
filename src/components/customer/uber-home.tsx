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
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      <div
        data-testid="home-mode-tabs"
        className="flex gap-2"
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
              className={`uber-press min-h-10 rounded-full px-4 text-sm ${
                selected
                  ? "bg-black font-bold text-white"
                  : "bg-transparent font-semibold text-gray-500"
              }`}
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
          className="uber-press flex min-h-14 flex-1 items-center gap-3 rounded-full bg-[#F5F5F5] px-4 text-left hover:bg-gray-200"
        >
          <Search className="h-5 w-5 shrink-0 text-black" aria-hidden />
          <span className="text-base font-semibold text-black">Where to?</span>
        </button>
        <button
          type="button"
          data-testid="home-later"
          onClick={() => setLaterOpen(true)}
          className="uber-press flex h-14 min-w-[5.25rem] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#F5F5F5] px-4 text-sm font-semibold text-black hover:bg-gray-200"
        >
          <Clock className="h-4 w-4" aria-hidden />
          Later
        </button>
      </div>

      <ul className="mt-3 space-y-2" data-testid="home-recents">
        {recents.map((place) => (
          <li key={place}>
            <button
              type="button"
              onClick={() =>
                router.push(`/ride?to=${encodeURIComponent(place)}`)
              }
              className="uber-press flex min-h-14 w-full items-center gap-3 rounded-2xl bg-[#F5F5F5] px-4 text-left hover:bg-gray-200"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200">
                <Clock className="h-4 w-4 text-black" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-black">
                {place}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          </li>
        ))}
      </ul>

      <section className="mt-7">
        <h2 className="text-lg font-bold text-black">For you</h2>
        <div
          data-testid="service-circles"
          className="-mx-1 mt-3 flex gap-4 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label="For you"
        >
          {FOR_YOU.map(({ href, label, Icon, badge }, i) => (
            <Link
              key={label}
              href={href}
              data-testid={`service-circle-${label.toLowerCase().replace(/\s+/g, "-")}`}
              data-primary={i === 0 ? "true" : "false"}
              className="uber-press relative flex w-[4.5rem] shrink-0 flex-col items-center gap-2"
            >
              {badge ? (
                <span className="absolute -top-1 right-0 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F5] text-black">
                <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-center text-xs font-medium text-black">
                {label}
              </span>
            </Link>
          ))}
        </div>
        <div data-testid="home-chips" className="sr-only">
          For you
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-black">More ways to use Village Ride</h2>
        <Link
          href="/ride?when=later"
          className="uber-press relative mt-3 block overflow-hidden rounded-2xl"
        >
          <span className="relative block aspect-[16/7] w-full bg-gray-200">
            <Image
              src="/home/banner-night.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 28rem) 100vw, 28rem"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-3 left-4 text-base font-bold text-white">
              Reserve a night ride
            </span>
          </span>
        </Link>
        <DriveSignupCard variant="compact" dismissible className="mt-3" />
      </section>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
