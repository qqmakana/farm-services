"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppLink } from "@/components/ui/app-link";

const PILLS = [
  {
    href: "/ride",
    label: "Ride",
    src: "/home/icons/car.png",
    match: (p: string, when: string | null) =>
      (p === "/" || p.startsWith("/ride")) && when !== "later",
  },
  {
    href: "/ride?when=later",
    label: "Reserve",
    src: "/home/icons/car.png",
    match: (p: string, when: string | null) =>
      p.startsWith("/ride") && when === "later",
  },
  {
    href: "/group",
    label: "Groups",
    src: "/home/icons/car.png",
    match: (p: string) => p.startsWith("/group"),
  },
  {
    href: "/farm",
    label: "Farm",
    src: "/home/icons/farm.png",
    match: (p: string) => p.startsWith("/farm"),
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
    href: "/delivery",
    label: "Delivery",
    src: "/home/icons/courier.png",
    match: (p: string) => p.startsWith("/delivery"),
  },
] as const;

function ServicePillsInner({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const when = searchParams.get("when");

  return (
    <div
      data-testid="service-pills"
      className={`grid grid-cols-4 gap-x-1 gap-y-2 px-1 pb-2 pt-1 font-[family-name:var(--font-display)] tracking-[-0.02em] ${className}`}
      role="navigation"
      aria-label="Services"
    >
      {PILLS.map((pill) => {
        const active = pill.match(pathname, when);
        return (
          <AppLink
            key={`${pill.label}-${pill.href}`}
            href={pill.href}
            aria-current={active ? "page" : undefined}
            data-testid={`service-pill-${pill.label.toLowerCase()}`}
            className={`uber-press relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[12px] ${
              active
                ? "font-bold text-[#0a0a0a]"
                : "font-semibold text-[#6b6b6b]"
            }`}
          >
            <span className="relative h-8 w-8 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pill.src}
                alt=""
                className="pointer-events-none h-8 w-8 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
              />
            </span>
            {pill.label}
            {active ? (
              <span className="absolute bottom-0 left-1/2 h-[3px] w-9 -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
            ) : null}
          </AppLink>
        );
      })}
    </div>
  );
}

/** Service shortcuts — wrapped grid so Reserve / Groups / Farm stay tappable. */
export function ServicePills({ className = "" }: { className?: string }) {
  return (
    <Suspense
      fallback={
        <div className={`h-24 ${className}`} data-testid="service-pills" />
      }
    >
      <ServicePillsInner className={className} />
    </Suspense>
  );
}
