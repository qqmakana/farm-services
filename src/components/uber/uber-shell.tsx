"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ShareAppButton } from "@/components/share-app-button";
import { BRAND } from "@/lib/brand";

const VillageMap = dynamic(
  () =>
    import("@/components/maps/village-map").then((m) => m.VillageMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-sm text-[#000000]">
        Loading map…
      </div>
    ),
  },
);

export function UberShell({
  children,
  pin = null,
  backHref,
  title,
  showTabBar = false,
}: {
  children: React.ReactNode;
  pin?: { lat: number; lng: number } | null;
  backHref?: string;
  title?: string;
  /** Reserve space for the customer bottom tab bar (Home). */
  showTabBar?: boolean;
}) {
  const bottomInset = showTabBar
    ? "calc(4rem + env(safe-area-inset-bottom, 0px))"
    : "0px";

  return (
    <div
      className="ru-force-light fixed inset-x-0 top-0 z-[45] flex flex-col bg-[#F9FAFB] font-[system-ui,Segoe_UI,sans-serif] text-slate-900"
      style={{ bottom: bottomInset }}
    >
      {/* Top ~55%: map */}
      <div className="relative h-[55%] min-h-[240px] w-full shrink-0">
        <VillageMap pin={pin} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between p-3">
          <div className="pointer-events-auto flex items-center gap-2">
            {backHref ? (
              <Link
                href={backHref}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#000000] shadow-md transition active:scale-95"
                aria-label="Back"
              >
                ←
              </Link>
            ) : null}
            <Link
              href="/"
              className="rounded-full bg-white/95 px-3 py-2 shadow-md backdrop-blur transition active:scale-95"
            >
              <span className="block text-sm font-bold text-[#000000]">
                {title ?? BRAND.appName}
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-[#000000]/70 uppercase">
                {BRAND.company}
              </span>
            </Link>
          </div>
          <div className="pointer-events-auto rounded-full bg-white/95 p-1 shadow-md [&_button]:rounded-full">
            <ShareAppButton />
          </div>
        </div>
      </div>

      {/* Bottom ~45%: floating sheet */}
      <div
        className="relative z-[500] -mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white text-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 pt-3 ${
            showTabBar
              ? "pb-4"
              : "pb-[max(1rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
