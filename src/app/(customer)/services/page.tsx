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
      <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#f4f4f5] text-[#0a0a0a]">
        <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
      </span>
      <span className="text-center text-xs font-medium text-[#0a0a0a]">
        {title}
      </span>
    </Link>
  );
}

function ServicesContent() {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white p-4 pb-28 pt-6 font-sans text-[#0a0a0a]">
      <h1 className="text-3xl font-semibold tracking-tight text-[#0a0a0a]">
        Services
      </h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-[#0a0a0a]">Go anywhere</h2>
        <Link
          href="/ride"
          className="uber-press relative mt-4 block overflow-hidden rounded-[24px] bg-[#0a0a0a] p-5 text-white"
        >
          <span className="absolute top-3 right-3 rounded-full bg-[#f02d3a] px-3 py-1 text-xs font-bold">
            20%
          </span>
          <span className="block pr-16 text-sm font-semibold">
            Get 20% off 10 trips
          </span>
          <span className="mt-1 block pr-16 text-xs font-medium text-white/70">
            Start with Village Pass · Ride, Delivery, Farm or Courier · cash or
            card
          </span>
        </Link>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GO_ANYWHERE.map((item) => (
            <CircleService key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#0a0a0a]">
          Get anything delivered
        </h2>
        <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-5">
          {DELIVERED.map((item) => (
            <CircleService key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#0a0a0a]">
          Get Courier to help
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Link
            href="/courier"
            className="uber-press relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-[24px] bg-[#f4f4f5] p-4"
          >
            <span className="absolute top-3 right-3 rounded-full bg-[#f02d3a] px-3 py-1 text-xs font-bold text-white">
              20%
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#0a0a0a]">Send items</span>
              <span className="mt-1 block text-xs font-medium text-[#71717a]">
                Person-to-person courier
              </span>
            </span>
            <Package className="h-8 w-8 text-[#0a0a0a]" strokeWidth={2} aria-hidden />
          </Link>
          <Link
            href="/shops"
            className="uber-press flex min-h-[8.5rem] flex-col justify-between rounded-[24px] bg-[#f4f4f5] p-4"
          >
            <span>
              <span className="block text-sm font-semibold text-[#0a0a0a]">
                Store pick-up
              </span>
              <span className="mt-1 block text-xs font-medium text-[#71717a]">
                Order from a local shop
              </span>
            </span>
            <ShoppingBag className="h-8 w-8 text-[#0a0a0a]" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </section>

      <Link
        href="/driver/join"
        className="uber-press mt-8 flex items-center gap-3 rounded-[24px] bg-[#0a0a0a] p-5 text-white"
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
        className="uber-press mt-4 w-full py-3 text-sm font-medium text-[#71717a]"
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
