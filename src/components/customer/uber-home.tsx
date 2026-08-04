"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Briefcase,
  Car,
  Clock,
  Package,
  Search,
  ShoppingBag,
  Tractor,
  Truck,
  Users,
} from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
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

/**
 * Uber-style content-first Home — chips, circular services, promos.
 * Map opens on booking screens after a service is chosen.
 */
export function UberHome() {
  const router = useRouter();
  const [chip, setChip] = useState<HomeChip>("for_you");

  const services = useMemo(
    () => ALL_SERVICES.filter((s) => s.chips.includes(chip)),
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

      {/* Where to? + Later */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="home-where-to"
          onClick={() => router.push("/ride")}
          className="flex min-h-14 flex-1 cursor-pointer items-center gap-3 rounded-full bg-gray-100 px-4 py-3 text-left transition-all duration-150 ease-out hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-black/10 focus:outline-none active:scale-[0.98]"
        >
          <Search className="h-5 w-5 shrink-0 text-black" aria-hidden />
          <span className="text-base font-semibold text-black">Where to?</span>
        </button>
        <button
          type="button"
          data-testid="home-later"
          onClick={() => router.push("/ride?when=later")}
          className="flex h-14 min-w-[5.5rem] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gray-100 px-4 text-sm font-semibold text-black transition-all duration-150 ease-out hover:bg-gray-200 active:scale-[0.98]"
        >
          <Clock className="h-4 w-4" aria-hidden />
          Later
        </button>
      </div>

      {/* Uber-style category chips (For you / Trip / Reserve…) */}
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
              className={`min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.98] ${
                active
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            className="group flex w-[4.5rem] shrink-0 cursor-pointer flex-col items-center gap-2 transition-all duration-150 ease-out active:scale-95"
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

      {/* Suggestions / promos */}
      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight text-black">
          Suggestions
        </h2>
        <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <PromoCard
            href="/partners"
            title="For businesses"
            body="Free signup · self-serve deliveries for shops & farms"
            Icon={Briefcase}
            accent="bg-[#E8F8F0]"
          />
          <PromoCard
            href="/driver/join"
            title="Drive with us"
            body="Keep 85% · browse jobs now, verify before first paid trip"
            Icon={Car}
            accent="bg-[#F3F3F3]"
          />
          <PromoCard
            href="/group"
            title="Group rides"
            body="Share the fare with others going the same way"
            Icon={Users}
            accent="bg-[#EEF2FF]"
          />
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-black">
          Get started
        </h2>
        <Link
          href="/ride"
          className="flex cursor-pointer items-center gap-4 rounded-2xl bg-gray-50 p-4 transition-all duration-150 ease-out hover:bg-gray-100 hover:shadow-md active:scale-[0.99]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <Car className="h-7 w-7" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-black">
              Book a Village Ride
            </span>
            <span className="mt-0.5 block text-sm text-gray-500">
              Landmark pickup · cash or card · night rides
            </span>
          </span>
        </Link>
        <Link
          href="/onboarding?replay=1"
          className="flex cursor-pointer items-center gap-4 rounded-2xl bg-gray-50 p-4 transition-all duration-150 ease-out hover:bg-gray-100 hover:shadow-md active:scale-[0.99]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-200 text-black">
            <Package className="h-7 w-7" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-black">
              See how it works
            </span>
            <span className="mt-0.5 block text-sm text-gray-500">
              Quick tour of Ride, Delivery, Farm &amp; Courier
            </span>
          </span>
        </Link>
      </section>
    </main>
  );
}

function PromoCard({
  href,
  title,
  body,
  Icon,
  accent,
}: {
  href: string;
  title: string;
  body: string;
  Icon: typeof Car;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`flex w-[16.5rem] shrink-0 cursor-pointer gap-3 rounded-2xl ${accent} p-4 transition-all duration-150 ease-out hover:shadow-md active:scale-[0.99]`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-black shadow-sm">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-black">{title}</span>
        <span className="mt-1 block text-xs leading-snug text-gray-600">
          {body}
        </span>
      </span>
    </Link>
  );
}
