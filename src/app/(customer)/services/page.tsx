"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Car,
  CircleDot,
  Package,
  ShoppingBag,
  Tractor,
  Truck,
  Users,
} from "lucide-react";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { ServicePills } from "@/components/uber/service-pills";
import { resetOnboardingForReplay } from "@/lib/onboarding";

const CARDS = [
  {
    href: "/ride",
    title: "Ride",
    subtitle: "Night rides & village trips",
    Icon: Car,
    image: "/home/sug-ride.jpg",
  },
  {
    href: "/shops",
    title: "Order anything",
    subtitle: "Local kitchens & spaza",
    Icon: ShoppingBag,
    image: "/home/sug-order.jpg",
  },
  {
    href: "/delivery",
    title: "Delivery",
    subtitle: "Goods, furniture & materials",
    Icon: Truck,
    image: "/home/sug-courier.jpg",
  },
  {
    href: "/courier",
    title: "Courier",
    subtitle: "Packages — village to city",
    Icon: Package,
    image: "/home/sug-courier.jpg",
  },
  {
    href: "/farm",
    title: "Farm",
    subtitle: "Produce, livestock & equipment",
    Icon: Tractor,
    image: "/home/sug-farm.jpg",
  },
  {
    href: "/group",
    title: "Groups",
    subtitle: "Split the fare · shared loads",
    Icon: Users,
    image: "/home/sug-family.jpg",
  },
  {
    href: "/driver/join",
    title: "Drive & earn",
    subtitle: "Keep 85% · browse jobs now",
    Icon: CircleDot,
    image: "/home/sug-ride.jpg",
  },
] as const;

function ServicesContent() {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6">
      <ServicePills className="mb-5" />

      <h1 className="text-3xl font-bold tracking-tight text-black">Services</h1>
      <p className="mt-1 text-sm text-gray-500">
        Same app for ride, shops, delivery, farm &amp; courier.
      </p>

      <ul className="mt-6 space-y-2">
        {CARDS.map((card) => {
          const Icon = card.Icon;
          return (
            <li key={card.href}>
              <Link
                href={card.href}
                className="uber-press flex items-center gap-3 rounded-2xl bg-gray-50 p-3 hover:bg-gray-100 active:bg-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-base font-bold text-black">
                    <Icon className="h-4 w-4" aria-hidden />
                    {card.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-gray-500">
                    {card.subtitle}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400" />
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => {
          resetOnboardingForReplay();
          router.push("/onboarding?replay=1");
        }}
        className="uber-press uber-btn-soft mt-8 w-full"
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
