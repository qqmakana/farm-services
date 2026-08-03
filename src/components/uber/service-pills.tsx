"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  Package,
  ShoppingBag,
  Tractor,
  Truck,
  Users,
} from "lucide-react";

const PILLS = [
  {
    href: "/ride",
    label: "Ride",
    Icon: Car,
    match: (p: string) => p === "/" || p.startsWith("/ride"),
  },
  {
    href: "/delivery",
    label: "Delivery",
    Icon: Truck,
    match: (p: string) => p.startsWith("/delivery"),
  },
  {
    href: "/courier",
    label: "Courier",
    Icon: Package,
    match: (p: string) => p.startsWith("/courier"),
  },
  {
    href: "/farm",
    label: "Farm",
    Icon: Tractor,
    match: (p: string) => p.startsWith("/farm"),
  },
  {
    href: "/shops",
    label: "Shops",
    Icon: ShoppingBag,
    match: (p: string) => p.startsWith("/shops") || p.startsWith("/shop"),
  },
  {
    href: "/group",
    label: "Groups",
    Icon: Users,
    match: (p: string) => p.startsWith("/group"),
  },
] as const;

/** Uber-style horizontal service pills — switches booking surface via route. */
export function ServicePills({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname() ?? "/";

  return (
    <div
      data-testid="service-pills"
      className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="tablist"
      aria-label="Services"
    >
      {PILLS.map((pill) => {
        const active = pill.match(pathname);
        const Icon = pill.Icon;
        return (
          <Link
            key={pill.href}
            href={pill.href}
            role="tab"
            aria-selected={active}
            data-testid={`service-pill-${pill.label.toLowerCase()}`}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition active:scale-[0.98] ${
              active
                ? "bg-black text-white"
                : "bg-white/95 text-[var(--ru-ink)] backdrop-blur hover:bg-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {pill.label}
          </Link>
        );
      })}
    </div>
  );
}
