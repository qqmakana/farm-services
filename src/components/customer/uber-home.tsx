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
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { Suspense } from "react";

/** Home-screen-only service filter — not bottom navigation. */
type HomeChip = "for_you" | "trip" | "reserve" | "delivery";

const CHIPS: { id: HomeChip; label: string }[] = [
  { id: "for_you", label: "For you" },
  { id: "trip", label: "Trip" },
  { id: "reserve", label: "Reserve" },
  { id: "delivery", label: "Delivery" },
];

type QuickAction = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

/** Icon row contents change with the selected pill (Uber service-line switcher). */
const QUICK_ACTIONS: Record<HomeChip, QuickAction[]> = {
  for_you: [
    { href: "/ride", label: "Ride", Icon: Car },
    { href: "/ride?when=later", label: "Reserve", Icon: Clock },
    { href: "/delivery", label: "Delivery", Icon: Truck },
    { href: "/shops", label: "Shops", Icon: ShoppingBag },
    { href: "/group", label: "Groups", Icon: Users },
  ],
  trip: [
    { href: "/ride", label: "Ride", Icon: Car },
    { href: "/ride?when=later", label: "Reserve", Icon: Clock },
    { href: "/group", label: "Groups", Icon: Users },
  ],
  reserve: [
    { href: "/ride?when=later", label: "Reserve", Icon: Clock },
    { href: "/ride", label: "Ride", Icon: Car },
  ],
  delivery: [
    { href: "/delivery", label: "Delivery", Icon: Truck },
    { href: "/shops", label: "Shops", Icon: ShoppingBag },
    { href: "/courier", label: "Courier", Icon: Package },
  ],
};

/** Merchandising cards — no price/ETA, pastel + photo only. */
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
    href: "/ride?when=later",
    title: "Reserve",
    image: "/home/sug-ride.jpg",
    bg: "bg-[#E8E8E8]",
    chips: ["for_you", "reserve"],
  },
  {
    href: "/shops",
    title: "Order\nanything",
    image: "/home/sug-order.jpg",
    bg: "bg-[#E8F5EE]",
    chips: ["for_you", "delivery"],
  },
  {
    href: "/group",
    title: "Village\ngroups",
    image: "/home/sug-family.jpg",
    bg: "bg-[#EAF0FF]",
    chips: ["for_you", "trip"],
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
    chips: ["for_you"],
  },
];

/**
 * Uber-style Home — search + promo + service pills filter this screen only.
 * Farm, Courier, etc. live on the Services bottom tab.
 */
export function UberHome() {
  const router = useRouter();
  const [chip, setChip] = useState<HomeChip>("for_you");
  const [laterOpen, setLaterOpen] = useState(false);

  const quickActions = useMemo(() => QUICK_ACTIONS[chip], [chip]);

  const suggestions = useMemo(
    () => SUGGESTIONS.filter((s) => s.chips.includes(chip)),
    [chip],
  );

  function openQuickAction(href: string) {
    if (href.includes("when=later")) {
      setLaterOpen(true);
      return;
    }
    router.push(href);
  }

  return (
    <main
      data-testid="uber-home"
      className="ru-force-light min-h-dvh touch-manipulation bg-white px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      {/* Where to? + Later + Help — no logo; search bar is the header */}
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
          onClick={() => setLaterOpen(true)}
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

      <DriveSignupCard variant="compact" dismissible className="mt-4" />

      {/* Service-line pills — filter icon row + suggestions on this screen only */}
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

      {/* Quick actions — first icon is primary for the selected pill */}
      <div
        data-testid="service-circles"
        className="-mx-1 mt-6 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="navigation"
        aria-label="Quick actions"
      >
        {quickActions.map(({ href, label, Icon }, index) => {
          const isPrimary = index === 0;
          return (
            <button
              key={`${chip}-${href}-${label}`}
              type="button"
              data-testid={`service-circle-${label.toLowerCase()}`}
              data-primary={isPrimary ? "true" : "false"}
              onClick={() => openQuickAction(href)}
              className="uber-press group flex w-[4.5rem] shrink-0 flex-col items-center gap-2"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-150 group-active:ring-2 group-active:ring-black ${
                  isPrimary
                    ? "bg-black text-white group-hover:bg-gray-800 group-active:bg-gray-900"
                    : "bg-gray-100 text-black group-hover:bg-gray-200 group-active:bg-gray-300"
                }`}
              >
                <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-center text-xs font-medium text-black">
                {label}
              </span>
            </button>
          );
        })}
      </div>

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

      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight text-black">
          More ways to use Village Ride
        </h2>
        <ul className="mt-4 space-y-3">
          <WayRow
            href="/services"
            title="All services"
            body="Farm, Courier, Shops, Groups & more"
            image="/home/sug-farm.jpg"
          />
          <WayRow
            href="/shops"
            title="Order almost anything"
            body="Local kitchens & spaza — delivered to your door"
            image="/home/sug-order.jpg"
          />
          <WayRow
            href="/group"
            title="Village groups"
            body="Share rides with people you trust"
            image="/home/sug-family.jpg"
          />
        </ul>
      </section>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
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
