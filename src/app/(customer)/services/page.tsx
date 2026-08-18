"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Car,
  CircleDot,
  Clock,
  Package,
  ShoppingBag,
  Tractor,
  Truck,
  Users,
} from "lucide-react";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { resetOnboardingForReplay } from "@/lib/onboarding";

const GO_ANYWHERE = [
  { href: "/ride", title: "Ride", subtitle: "Book a ride now", Icon: Car },
  {
    href: "/ride?when=later",
    title: "Reserve",
    subtitle: "Schedule for later",
    Icon: Clock,
  },
  { href: "/group", title: "Groups", subtitle: "Split the fare", Icon: Users },
] as const;

const GET_DELIVERED = [
  {
    href: "/shops",
    title: "Shops",
    subtitle: "Local kitchens & spaza",
    Icon: ShoppingBag,
  },
  {
    href: "/delivery",
    title: "Delivery",
    subtitle: "Goods & furniture",
    Icon: Truck,
  },
  {
    href: "/courier",
    title: "Courier",
    subtitle: "Send a package",
    Icon: Package,
  },
  {
    href: "/farm",
    title: "Farm",
    subtitle: "Produce & livestock",
    Icon: Tractor,
  },
] as const;

function ServiceTile({
  href,
  title,
  subtitle,
  Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  Icon: typeof Car;
}) {
  return (
    <Link
      href={href}
      className="uber-press flex min-h-[6.75rem] flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 px-2 py-3 hover:bg-gray-200"
    >
      <Icon className="h-8 w-8 text-black" strokeWidth={1.5} aria-hidden />
      <span className="text-center">
        <span className="block text-sm font-bold text-black">{title}</span>
        <span className="mt-0.5 block text-[11px] text-gray-500">{subtitle}</span>
      </span>
    </Link>
  );
}

function ServicesContent() {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6">
      <h1 className="text-3xl font-bold tracking-tight text-black">Services</h1>
      <p className="mt-1 text-sm text-gray-500">
        Village Ride for villages, towns &amp; cities — rides, shops, delivery,
        farm &amp; courier.
      </p>

      <section className="mt-7">
        <h2 className="text-lg font-bold text-black">Go anywhere</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {GO_ANYWHERE.map((card) => (
            <ServiceTile key={card.href} {...card} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-black">Get almost anything delivered</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {GET_DELIVERED.map((card) => (
            <ServiceTile key={card.href} {...card} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-black">Get Courier to help</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/courier"
            className="uber-press flex min-h-[7rem] items-end justify-between gap-2 rounded-2xl bg-gray-100 p-4"
          >
            <span>
              <span className="block text-sm font-bold text-black">
                Send items
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                Person-to-person courier
              </span>
            </span>
            <Package className="h-8 w-8 text-black" aria-hidden />
          </Link>
          <Link
            href="/shops"
            className="uber-press flex min-h-[7rem] items-end justify-between gap-2 rounded-2xl bg-gray-100 p-4"
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
        <CircleDot className="h-5 w-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Drive &amp; earn</span>
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
        className="uber-press uber-btn-soft mt-4 w-full"
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
