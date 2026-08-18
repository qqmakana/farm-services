"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Car,
  Clock,
  HeartPulse,
  Package,
  ShoppingBag,
  Sprout,
  Store,
  Tractor,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { resetOnboardingForReplay } from "@/lib/onboarding";

const GO_ANYWHERE: { href: string; title: string; Icon: LucideIcon }[] = [
  { href: "/ride", title: "Trip", Icon: Car },
  { href: "/ride?when=later", title: "Reserve", Icon: Clock },
  { href: "/group", title: "Groups", Icon: Users },
  { href: "/farm", title: "Farm", Icon: Tractor },
];

const DELIVERED: { href: string; title: string; Icon: LucideIcon }[] = [
  { href: "/shops", title: "Shops", Icon: Store },
  { href: "/delivery", title: "Delivery", Icon: Truck },
  { href: "/courier", title: "Courier", Icon: Package },
  { href: "/farm", title: "Farm", Icon: Tractor },
  { href: "/shops", title: "Hardware", Icon: Wrench },
  { href: "/shops", title: "Spaza", Icon: ShoppingBag },
  { href: "/farm", title: "Feed", Icon: Sprout },
  { href: "/shops", title: "Clinic run", Icon: HeartPulse },
];

function CircleService({
  href,
  title,
  Icon,
}: {
  href: string;
  title: string;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="uber-press flex flex-col items-center gap-2"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F5] text-black">
        <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-center text-xs font-medium text-black">{title}</span>
    </Link>
  );
}

function ServicesContent() {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6">
      <h1 className="text-3xl font-bold tracking-tight text-black">Services</h1>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-black">Go anywhere</h2>
        <Link
          href="/ride"
          className="uber-press mt-3 flex items-start justify-between gap-3 overflow-hidden rounded-2xl bg-black px-4 py-4 text-white"
        >
          <span>
            <span className="block text-sm font-bold">
              Get 20% off 10 trips
            </span>
            <span className="mt-0.5 block text-xs text-white/70">
              Start with Village Pass · Ride, Delivery, Farm or Courier · cash
              or card
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold">
            20%
          </span>
        </Link>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GO_ANYWHERE.map((item) => (
            <CircleService key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-black">Get anything delivered</h2>
        <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-5">
          {DELIVERED.map((item) => (
            <CircleService key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-black">Get Courier to help</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link
            href="/courier"
            className="uber-press relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-2xl bg-[#F5F5F5] p-4"
          >
            <span className="absolute top-3 right-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              20%
            </span>
            <span>
              <span className="block text-sm font-bold text-black">Send items</span>
              <span className="mt-1 block text-xs text-gray-500">
                Person-to-person courier
              </span>
            </span>
            <Package className="h-8 w-8 text-black" aria-hidden />
          </Link>
          <Link
            href="/shops"
            className="uber-press flex min-h-[8.5rem] flex-col justify-between rounded-2xl bg-[#F5F5F5] p-4"
          >
            <span>
              <span className="block text-sm font-bold text-black">
                Store pick-up
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                Order from a local shop
              </span>
            </span>
            <ShoppingBag className="h-8 w-8 text-black" aria-hidden />
          </Link>
        </div>
      </section>

      <Link
        href="/driver/join"
        className="uber-press mt-8 flex items-center gap-3 rounded-2xl bg-black p-4 text-white"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Earn by driving</span>
          <span className="mt-0.5 block text-xs text-white/70">
            We humbly need a few more drivers · keep ~90%
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-white/70" />
      </Link>

      <button
        type="button"
        onClick={() => {
          resetOnboardingForReplay();
          router.push("/onboarding?replay=1");
        }}
        className="uber-press mt-4 w-full py-3 text-sm font-semibold text-gray-500"
      >
        See how it works
      </button>
    </main>
  );
}

export default function ServicesPage() {
  return (
    <OnboardingGate>
      <ServicesContent />
    </OnboardingGate>
  );
}
