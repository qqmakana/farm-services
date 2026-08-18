"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  Car,
  ChevronRight,
  Clock,
  Gift,
  HelpCircle,
  LocateFixed,
  MapPin,
  Package,
  Tractor,
  Truck,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { Suspense } from "react";
import { useCountry } from "@/components/country/country-provider";
import { getGuestProfile } from "@/lib/guest-profile";
import { listShops } from "@/lib/actions";
import { zonesForCountry } from "@/lib/service-area";
import type { Shop } from "@/lib/types";

/** Desktop Uber Suggestions → stacked mobile grid. Village Ride services only. */
const SUGGESTIONS: {
  href: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { href: "/ride", label: "Ride", Icon: Car },
  { href: "/ride?when=later", label: "Reserve", Icon: Clock },
  { href: "/courier", label: "Courier", Icon: Package },
  { href: "/delivery", label: "Delivery", Icon: Truck },
  { href: "/farm", label: "Farm", Icon: Tractor },
  { href: "/group", label: "Groups", Icon: Users },
];

function cityLabel(countryCode: string, countryName: string): string {
  const zones = zonesForCountry(countryCode);
  if (zones.length >= 2) {
    const a = zones[0].name.split(" / ")[0];
    const b = zones[1].name.split(" / ")[0];
    return `${a} and ${b}, ${countryCode}`;
  }
  if (zones[0]) return `${zones[0].name}, ${countryCode}`;
  return `${countryName}, ${countryCode}`;
}

/**
 * Mobile look-alike of Uber's desktop home: request-a-ride, circle/square
 * locations, gray suggestion tiles, shop circles, Reserve, get-the-app.
 */
export function UberHome() {
  const router = useRouter();
  const { country, countryCode } = useCountry();
  const [laterOpen, setLaterOpen] = useState(false);
  const [pickupNow, setPickupNow] = useState(true);
  const [name, setName] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const guest = getGuestProfile();
    if (guest?.name) setName(guest.name.trim());
    void listShops()
      .then((rows) => setShops(rows.slice(0, 10)))
      .catch(() => setShops([]));
  }, []);

  const firstName = name.split(" ")[0] || "";
  const city = cityLabel(countryCode, country.name);

  function goSeePrices() {
    if (pickupNow) router.push("/ride");
    else setLaterOpen(true);
  }

  function openSuggestion(href: string) {
    if (href.includes("when=later")) {
      setLaterOpen(true);
      return;
    }
    router.push(href);
  }

  return (
    <main
      data-testid="uber-home"
      className="ru-force-light min-h-dvh touch-manipulation bg-white pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      {/* Welcome strip — desktop Uber dark bar, stacked for mobile */}
      <div className="bg-black px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight">
              {firstName ? `Welcome back, ${firstName}` : "Welcome to Village Ride"}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/65">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              You have no upcoming trips
            </p>
          </div>
          <Link
            href="/help"
            className="uber-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-3 flex gap-2">
          <WelcomeChip href="/activity" label="Activity" Icon={Clock} />
          <WelcomeChip href="/account" label="Promotions" Icon={Gift} />
          <WelcomeChip href="/account" label="Account" Icon={User} />
        </div>
      </div>

      <div className="px-4 pt-5">
        <p className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="h-4 w-4 shrink-0 text-black" aria-hidden />
          <span className="min-w-0 truncate">{city}</span>
          <Link
            href="/account"
            className="ml-1 shrink-0 font-semibold text-black underline underline-offset-2"
          >
            Change city
          </Link>
        </p>

        <h1 className="mt-3 text-[2rem] leading-none font-bold tracking-tight text-black">
          Request a ride
        </h1>

        <button
          type="button"
          data-testid="home-later"
          onClick={() => {
            setPickupNow(false);
            setLaterOpen(true);
          }}
          className="uber-press mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-gray-100 px-4 text-sm font-semibold text-black hover:bg-gray-200"
        >
          <Clock className="h-4 w-4" aria-hidden />
          {pickupNow ? "Pickup now" : "Pickup later"}
          <span className="text-gray-400" aria-hidden>
            ▾
          </span>
        </button>

        {/* Circle / square location stack — desktop Uber inputs */}
        <div className="mt-4 flex gap-3">
          <div className="flex w-3 shrink-0 flex-col items-center py-4">
            <span className="h-2.5 w-2.5 rounded-full bg-black" aria-hidden />
            <span className="my-1 w-px flex-1 bg-gray-300" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-black" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <button
              type="button"
              onClick={() => router.push("/ride")}
              className="uber-press flex min-h-14 w-full items-center gap-2 rounded-xl bg-gray-100 px-4 text-left hover:bg-gray-200"
            >
              <span className="flex-1 text-[15px] text-gray-500">
                Enter location
              </span>
              <LocateFixed className="h-5 w-5 text-black" aria-hidden />
            </button>
            <button
              type="button"
              data-testid="home-where-to"
              onClick={() => router.push("/ride")}
              className="uber-press flex min-h-14 w-full items-center rounded-xl bg-gray-100 px-4 text-left hover:bg-gray-200"
            >
              <span className="text-[15px] text-gray-500">
                Enter destination
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          data-testid="home-see-prices"
          onClick={goSeePrices}
          className="uber-press mt-4 flex min-h-14 w-full items-center justify-center rounded-lg bg-black text-base font-semibold text-white hover:bg-gray-800"
        >
          See prices
        </button>
      </div>

      <div className="px-4">
        <DriveSignupCard variant="compact" dismissible className="mt-6" />
      </div>

      {/* Suggestions — 3×2 gray illustration tiles */}
      <section className="mt-8 px-4">
        <h2 className="text-lg font-bold tracking-tight text-black">
          Suggestions
        </h2>
        <div
          data-testid="home-chips"
          className="mt-3 grid grid-cols-3 gap-2"
          role="list"
          aria-label="Suggestions"
        >
          {SUGGESTIONS.map(({ href, label, Icon }, i) => (
            <button
              key={label}
              type="button"
              role="listitem"
              data-testid={`service-circle-${label.toLowerCase()}`}
              data-primary={i === 0 ? "true" : "false"}
              onClick={() => openSuggestion(href)}
              className="uber-press flex min-h-[6.5rem] flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 px-2 py-3 hover:bg-gray-200"
            >
              <span className="flex h-12 w-12 items-center justify-center text-black">
                <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="text-sm font-semibold text-black">{label}</span>
            </button>
          ))}
        </div>
        <div data-testid="service-circles" className="sr-only">
          Suggestions
        </div>
      </section>

      {/* Shop circles — Get almost anything delivered */}
      <section className="mt-8">
        <div className="flex items-end justify-between px-4">
          <h2 className="text-lg font-bold tracking-tight text-black">
            Get almost anything delivered
          </h2>
          <Link
            href="/shops"
            className="text-sm font-semibold text-black underline underline-offset-2"
          >
            See all
          </Link>
        </div>
        <div
          data-testid="home-shop-circles"
          className="mt-4 flex gap-4 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(shops.length
            ? shops
            : [
                { id: "s1", name: "Local shops", image_url: null as string | null },
                { id: "s2", name: "Spaza", image_url: null as string | null },
                { id: "s3", name: "Hardware", image_url: null as string | null },
              ]
          ).map((shop) => (
            <Link
              key={shop.id}
              href={shops.length ? `/shops/${shop.id}` : "/shops"}
              className="uber-press flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-bold text-black ring-1 ring-gray-200">
                {shop.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shop.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  shop.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-black">
                {shop.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Reserve — desktop Uber Reserve hero, stacked */}
      <section className="mx-4 mt-8 overflow-hidden rounded-2xl bg-[#E5F1F1] p-4">
        <h2 className="text-xl font-bold tracking-tight text-black">
          Get your ride right with Reserve
        </h2>
        <p className="mt-1 text-sm text-gray-600">Choose date and time</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLaterOpen(true)}
            className="uber-press flex min-h-12 items-center gap-2 rounded-xl bg-white px-3 text-sm font-medium text-gray-600"
          >
            <Calendar className="h-4 w-4 text-black" aria-hidden />
            Date
          </button>
          <button
            type="button"
            onClick={() => setLaterOpen(true)}
            className="uber-press flex min-h-12 items-center gap-2 rounded-xl bg-white px-3 text-sm font-medium text-gray-600"
          >
            <Clock className="h-4 w-4 text-black" aria-hidden />
            Time
          </button>
        </div>
        <button
          type="button"
          onClick={() => setLaterOpen(true)}
          className="uber-press mt-3 flex min-h-12 w-full items-center justify-center rounded-lg bg-black text-sm font-semibold text-white"
        >
          Next
        </button>
        <ul className="mt-4 space-y-2 text-xs text-gray-700">
          <li>Choose your pickup time in advance.</li>
          <li>Extra wait time included to meet your ride.</li>
          <li>Cancel at no charge while still searching.</li>
        </ul>
      </section>

      {/* It's easier in the apps */}
      <section className="mt-8 bg-gray-50 px-4 py-8">
        <h2 className="text-center text-xl font-bold tracking-tight text-black">
          It&apos;s easier in the apps
        </h2>
        <div className="mt-4 space-y-2">
          <Link
            href="/get-app"
            className="uber-press flex items-center justify-between rounded-2xl bg-white p-4"
          >
            <span>
              <span className="block text-sm font-bold text-black">
                Download Village Ride
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Install on this phone
              </span>
            </span>
            <ChevronRight className="h-5 w-5 text-gray-400" aria-hidden />
          </Link>
          <Link
            href="/driver/join"
            className="uber-press flex items-center justify-between rounded-2xl bg-white p-4"
          >
            <span>
              <span className="block text-sm font-bold text-black">
                Download the Driver app
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Earn with your car, bakkie or truck
              </span>
            </span>
            <ChevronRight className="h-5 w-5 text-gray-400" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Sticky See prices — desktop Uber bottom bar */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[55] w-full max-w-md -translate-x-1/2">
        <button
          type="button"
          onClick={goSeePrices}
          className="uber-press flex min-h-12 w-full items-center justify-center bg-black text-base font-semibold text-white"
        >
          See prices
        </button>
      </div>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}

function WelcomeChip({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="uber-press flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 px-2 text-xs font-semibold text-white"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}
