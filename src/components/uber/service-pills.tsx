"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PILLS = [
  {
    href: "/ride",
    label: "Ride",
    src: "/home/icons/car.png",
    match: (p: string) => p === "/" || p.startsWith("/ride"),
  },
  {
    href: "/shops",
    label: "Shops",
    src: "/home/icons/shops.png",
    match: (p: string) => p.startsWith("/shops") || p.startsWith("/shop"),
  },
  {
    href: "/courier",
    label: "Courier",
    src: "/home/icons/courier.png",
    match: (p: string) => p.startsWith("/courier"),
  },
  {
    href: "/farm",
    label: "Farm",
    src: "/home/icons/farm.png",
    match: (p: string) => p.startsWith("/farm"),
  },
  {
    href: "/delivery",
    label: "Delivery",
    src: "/home/icons/courier.png",
    match: (p: string) => p.startsWith("/delivery"),
  },
  {
    href: "/group",
    label: "Groups",
    src: "/home/icons/car.png",
    match: (p: string) => p.startsWith("/group"),
  },
] as const;

/** Uber Home-style illustrated service tabs. */
export function ServicePills({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";

  return (
    <div
      data-testid="service-pills"
      className={`-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 font-[family-name:var(--font-display)] tracking-[-0.02em] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="tablist"
      aria-label="Services"
    >
      {PILLS.map((pill) => {
        const active = pill.match(pathname);
        return (
          <Link
            key={pill.href}
            href={pill.href}
            role="tab"
            aria-selected={active}
            data-testid={`service-pill-${pill.label.toLowerCase()}`}
            className={`uber-press relative flex w-[4.35rem] shrink-0 flex-col items-center gap-1 pb-2.5 text-[12px] ${
              active
                ? "font-bold text-[#0a0a0a]"
                : "font-semibold text-[#6b6b6b]"
            }`}
          >
            <span className="relative h-8 w-8">
              <Image
                src={pill.src}
                alt=""
                fill
                className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
                sizes="32px"
              />
            </span>
            {pill.label}
            {active ? (
              <span className="absolute bottom-0 left-1/2 h-[3px] w-9 -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
