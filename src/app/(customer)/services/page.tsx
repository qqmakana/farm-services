"use client";

import Link from "next/link";
import { Car, CircleDot, Package, Tractor, Truck, Users } from "lucide-react";
import { DriverWantedPromoCard } from "@/components/driver-wanted-promo-card";

const cards = [
  {
    href: "/ride",
    title: "Village Ride",
    subtitle: "Night rides & village trips",
    Icon: Car,
    accent: "bg-sky-50 text-sky-700",
    iconBg: "bg-sky-100",
  },
  {
    href: "/delivery",
    title: "Village Delivery",
    subtitle: "Goods, furniture & materials",
    Icon: Truck,
    accent: "bg-emerald-50 text-emerald-800",
    iconBg: "bg-emerald-100",
  },
  {
    href: "/farm",
    title: "Farm Connect",
    subtitle: "Produce, livestock & equipment",
    Icon: Tractor,
    accent: "bg-orange-50 text-orange-800",
    iconBg: "bg-orange-100",
  },
  {
    href: "/courier",
    title: "Courier",
    subtitle: "Packages between villages",
    Icon: Package,
    accent: "bg-violet-50 text-violet-800",
    iconBg: "bg-violet-100",
  },
  {
    href: "/group",
    title: "Group Rides",
    subtitle: "Split the fare · shared loads",
    Icon: Users,
    accent: "bg-indigo-50 text-indigo-800",
    iconBg: "bg-indigo-100",
  },
  {
    href: "/driver/join",
    title: "Become a Driver",
    subtitle: "Earn with Village Ride",
    Icon: CircleDot,
    accent: "bg-gray-50 text-gray-800",
    iconBg: "bg-gray-200",
  },
] as const;

export default function ServicesPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        What do you need today?
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Choose a service to get started
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.Icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`flex min-h-[148px] flex-col rounded-xl border border-gray-100 p-4 shadow-sm transition active:scale-95 ${card.accent}`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              </span>
              <span className="mt-auto pt-4">
                <span className="block text-sm font-bold leading-snug">
                  {card.title}
                </span>
                <span className="mt-1 block text-xs opacity-80">
                  {card.subtitle}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <DriverWantedPromoCard />
    </main>
  );
}
