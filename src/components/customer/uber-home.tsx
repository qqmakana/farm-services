"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Car,
  Clock,
  HelpCircle,
  Package,
  Search,
  ShoppingBag,
  Tractor,
  Truck,
  Users,
} from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";
import { Suspense } from "react";

type HomeChip = "for_you" | "trip" | "reserve" | "delivery" | "shops" | "groups";

const CHIPS: { id: HomeChip; label: string }[] = [
  { id: "for_you", label: "For you" },
  { id: "trip", label: "Trip" },
  { id: "reserve", label: "Reserve" },
  { id: "delivery", label: "Delivery" },
  { id: "shops", label: "Shops" },
  { id: "groups", label: "Groups" },
];

const ALL_SERVICES = [
  { href: "/ride", label: "Ride", Icon: Car, chips: ["for_you", "trip"] as HomeChip[] },
  {
    href: "/ride?when=later",
    label: "Reserve",
    Icon: Clock,
    chips: ["for_you", "reserve"] as HomeChip[],
  },
  {
    href: "/delivery",
    label: "Delivery",
    Icon: Truck,
    chips: ["for_you", "delivery"] as HomeChip[],
  },
  {
    href: "/courier",
    label: "Courier",
    Icon: Package,
    chips: ["for_you", "delivery"] as HomeChip[],
  },
  {
    href: "/farm",
    label: "Farm",
    Icon: Tractor,
    chips: ["for_you", "delivery"] as HomeChip[],
  },
  {
    href: "/shops",
    label: "Shops",
    Icon: ShoppingBag,
    chips: ["for_you", "shops"] as HomeChip[],
  },
  {
    href: "/group",
    label: "Groups",
    Icon: Users,
    chips: ["for_you", "groups"] as HomeChip[],
  },
] as const;

/** Uber-style image suggestion tiles (horizontal scroll). */
const SUGGESTIONS: {
  href: string;
  title: string;
  image: string;
  bg: string;
  chips: HomeChip[];
}[] = [
  {
    href: "/ride",
    title: "Ride",
    image: "/home/sug-ride.jpg",
    bg: "bg-[#E8E8E8]",
    chips: ["for_you", "trip", "reserve"],
  },
  {
    href: "/shops",
    title: "Order\nanything",
    image: "/home/sug-order.jpg",
    bg: "bg-[#E8F5EE]",
    chips: ["for_you", "shops", "delivery"],
  },
  {
    href: "/group",
    title: "Family &\nteens",
    image: "/home/sug-family.jpg",
    bg: "bg-[#EAF0FF]",
    chips: ["for_you", "groups", "trip"],
  },
  {
    href: "/courier",
    title: "Send a\npackage",
    image: "/home/sug-courier.jpg",
    bg: "bg-[#F3F0EA]",
    chips: ["for_you", "delivery"],
  },
  {
    href: "/farm",
    title: "Farm\nloads",
    image: "/home/sug-farm.jpg",
    bg: "bg-[#EAF6E8]",
    chips: ["for_you", "delivery"],
  },
];

/**
 * Uber-style content-first Home — chips, circular services, photo suggestions.
 * Map opens on booking screens after a service is chosen.
 */
export function UberHome() {
  const router = useRouter();
  const [chip, setChip] = useState<HomeChip>("for_you");

  const services = useMemo(
    () => ALL_SERVICES.filter((s) => s.chips.includes(chip)),
    [chip],
  );

  const suggestions = useMemo(
    () => SUGGESTIONS.filter((s) => s.chips.includes(chip)),
    [chip],
  );

  return (
    <main
      data-testid="uber-home"
      className="ru-force-light min-h-dvh touch-manipulation bg-white px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      {/* Where to? + Later + Help (Uber chrome) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="home-where-to"
          onClick={() => router.push("/ride")}
          className="uber-press flex min-h-14 flex-1 items-center gap-3 rounded-full bg-gray-100 px-4 py-3 text-left hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-black/10 focus:outline-none active:bg-gray-300"
        >
          <Search className="h-5 w-5 shrink-0 text-black" aria-hidden />
          <span className="text-base font-semibold text-black">Where to?</span>
        </button>
        <button
          type="button"
          data-testid="home-later"
          onClick={() => router.push("/ride?when=later")}
          className="uber-press flex h-14 min-w-[5.5rem] shrink-0 items-center justify-center gap-1.5 rounded-full bg-gray-100 px-4 text-sm font-semibold text-black hover:bg-gray-200 active:bg-gray-300"
        >
          <Clock className="h-4 w-4" aria-hidden />
          Later
        </button>
        <Link
          href="/help"
          className="uber-press flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-black hover:bg-gray-200 active:bg-gray-300"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" aria-hidden />
          <span className="sr-only">Help</span>
        </Link>
      </div>

      {/* Uber-style category chips */}
      <div
        data-testid="home-chips"
        className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Home categories"
      >
        {CHIPS.map((c) => {
          const active = chip === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`home-chip-${c.id}`}
              onClick={() => setChip(c.id)}
              className={`uber-press min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
                active
                  ? "bg-black text-white hover:bg-gray-800 active:bg-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Circular service icons */}
      <div
        data-testid="service-circles"
        className="-mx-1 mt-6 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="navigation"
        aria-label="Services"
      >
        {services.map(({ href, label, Icon }) => (
          <Link
            key={`${chip}-${href}-${label}`}
            href={href}
            data-testid={`service-circle-${label.toLowerCase()}`}
            className="uber-press group flex w-[4.5rem] shrink-0 flex-col items-center gap-2"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-black transition-all duration-150 group-hover:bg-gray-200 group-active:bg-gray-300 group-active:ring-2 group-active:ring-black">
              <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-center text-xs font-medium text-black">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Suggestions — photo tiles like Uber */}
      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight text-black">
          Suggestions
        </h2>
        <div
          data-testid="home-suggestions"
          className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {suggestions.map((s) => (
            <SuggestionCard key={s.href + s.title} {...s} />
          ))}
        </div>
      </section>

      {/* Full-bleed promo banner */}
      <section className="mt-8">
        <Link
          href="/ride?when=later"
          className="uber-press relative block overflow-hidden rounded-2xl active:opacity-95"
        >
          <div className="relative aspect-[16/9] w-full bg-gray-900">
            <Image
              src="/home/banner-night.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 28rem) 100vw, 28rem"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-lg font-bold tracking-tight text-white">
                Go anytime
              </p>
              <p className="mt-0.5 text-sm text-white/85">
                Reserve a night ride before you leave
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Driver signup — easy to find */}
      <DriveSignupCard className="mt-8" />

      {/* More ways to use Village Ride — Uber list with photos */}
      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight text-black">
          More ways to use Village Ride
        </h2>
        <ul className="mt-4 space-y-3">
          <WayRow
            href="/shops"
            title="Order almost anything"
            body="Local kitchens & spaza — delivered to your door"
            image="/home/sug-order.jpg"
          />
          <WayRow
            href="/group"
            title="Family & teens"
            body="Share rides safely with people you trust"
            image="/home/sug-family.jpg"
          />
          <WayRow
            href="/farm"
            title="Move farm goods"
            body="Bakkie & truck for crates, feed and harvest"
            image="/home/sug-farm.jpg"
          />
        </ul>
      </section>
    </main>
  );
}

function SuggestionCard({
  href,
  title,
  image,
  bg,
}: {
  href: string;
  title: string;
  image: string;
  bg: string;
}) {
  return (
    <Link
      href={href}
      className={`uber-press relative flex h-[11.5rem] w-[8.75rem] shrink-0 flex-col overflow-hidden rounded-2xl ${bg}`}
    >
      <p className="relative z-10 px-3 pt-3 text-[15px] leading-tight font-bold whitespace-pre-line text-black">
        {title}
      </p>
      <div className="absolute inset-x-0 bottom-0 h-[65%]">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover object-center"
          sizes="140px"
        />
      </div>
    </Link>
  );
}

function WayRow({
  href,
  title,
  body,
  image,
}: {
  href: string;
  title: string;
  body: string;
  image: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="uber-press flex items-center gap-3 rounded-2xl bg-gray-50 p-3 hover:bg-gray-100 active:bg-gray-200"
      >
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-200">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-black">{title}</span>
          <span className="mt-0.5 block text-sm leading-snug text-gray-500">
            {body}
          </span>
        </span>
      </Link>
    </li>
  );
}
