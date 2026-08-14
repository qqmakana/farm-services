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
  {
    href: "/ride",
    title: "Trip",
    subtitle: "Book a ride now",
    Icon: Car,
    image: "/home/sug-ride.jpg",
  },
  {
    href: "/ride?when=later",
    title: "Reserve",
    subtitle: "Schedule for later",
    Icon: Clock,
    image: "/home/sug-ride.jpg",
  },
  {
    href: "/group",
    title: "Groups",
    subtitle: "Split the fare",
    Icon: Users,
    image: "/home/sug-family.jpg",
  },
] as const;

const GET_DELIVERED = [
  {
    href: "/shops",
    title: "Shops",
    subtitle: "Local kitchens & spaza",
    Icon: ShoppingBag,
    image: "/home/sug-order.jpg",
    large: true,
  },
  {
    href: "/delivery",
    title: "Delivery",
    subtitle: "Goods & furniture",
    Icon: Truck,
    image: "/home/sug-courier.jpg",
    large: true,
  },
  {
    href: "/courier",
    title: "Courier",
    subtitle: "Send a package",
    Icon: Package,
    image: "/home/sug-courier.jpg",
    large: false,
  },
  {
    href: "/farm",
    title: "Farm",
    subtitle: "Produce & livestock",
    Icon: Tractor,
    image: "/home/sug-farm.jpg",
    large: false,
  },
] as const;

function ServiceTile({
  href,
  title,
  subtitle,
  image,
  Icon,
  large = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  image: string;
  Icon: typeof Car;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`uber-press flex flex-col overflow-hidden rounded-2xl bg-gray-100 ${
        large ? "min-h-[9.5rem]" : "min-h-[7.5rem]"
      }`}
    >
      <div className="relative flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-black">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <span className="bg-gray-100 px-3 py-2.5">
        <span className="block text-sm font-bold text-black">{title}</span>
        <span className="mt-0.5 block text-xs text-gray-500">{subtitle}</span>
      </span>
    </Link>
  );
}

function ServicesContent() {
  const router = useRouter();
  const large = GET_DELIVERED.filter((c) => c.large);
  const small = GET_DELIVERED.filter((c) => !c.large);

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
        <h2 className="text-lg font-bold text-black">Get anything delivered</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {large.map((card) => (
            <ServiceTile key={card.href} {...card} large />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {small.map((card) => (
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
