"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppLink } from "@/components/ui/app-link";
import {
  ArtCourier,
  ArtGrocery,
  ArtReserve,
  ArtSafety,
  ArtTripStop,
} from "@/components/customer/uber-service-tile";

const PILLS: {
  href: string;
  label: string;
  src?: string;
  art?: ReactNode;
  match: (p: string, when: string | null, stop: string | null) => boolean;
}[] = [
  {
    href: "/ride",
    label: "Trip",
    src: "/home/icons/car.png",
    match: (p, when, stop) =>
      (p === "/" || p.startsWith("/ride")) && when !== "later" && stop !== "1",
  },
  {
    href: "/ride?stop=1",
    label: "+ Stop",
    art: <ArtTripStop />,
    match: (p, _when, stop) => p.startsWith("/ride") && stop === "1",
  },
  {
    href: "/courier",
    label: "Send",
    art: <ArtCourier />,
    match: (p) => p.startsWith("/courier"),
  },
  {
    href: "/delivery",
    label: "Fetch",
    art: <ArtGrocery />,
    match: (p) => p.startsWith("/delivery"),
  },
  {
    href: "/ride?when=later",
    label: "Reserve",
    art: <ArtReserve />,
    match: (p, when) => p.startsWith("/ride") && when === "later",
  },
  {
    href: "/safety",
    label: "Safety",
    art: <ArtSafety />,
    match: (p) => p.startsWith("/safety"),
  },
];

function ServicePillsInner({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const when = searchParams.get("when");
  const stop = searchParams.get("stop");

  return (
    <div
      data-testid="service-pills"
      className={`grid grid-cols-3 gap-x-1 gap-y-2 px-1 pb-2 pt-1 font-[family-name:var(--font-display)] tracking-[-0.02em] ${className}`}
      role="navigation"
      aria-label="Services"
    >
      {PILLS.map((pill) => {
        const active = pill.match(pathname, when, stop);
        return (
          <AppLink
            key={`${pill.label}-${pill.href}`}
            href={pill.href}
            aria-current={active ? "page" : undefined}
            data-testid={`service-pill-${pill.label.toLowerCase().replace(/\s+/g, "-").replace("+", "plus")}`}
            className={`uber-press relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[12px] ${
              active
                ? "font-bold text-[#0a0a0a]"
                : "font-semibold text-[#6b6b6b]"
            }`}
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
              {pill.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pill.src}
                  alt=""
                  className="pointer-events-none h-8 w-8 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
                />
              ) : (
                <span className="pointer-events-none flex h-8 w-8 items-center justify-center [&>svg]:h-8 [&>svg]:w-8">
                  {pill.art}
                </span>
              )}
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

/** Service shortcuts — six products, one Village Ride sedan. */
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
