import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";

/** Focused trip-tracking header — no marketing mega-nav. */
export function TripChrome({ referenceCode }: { referenceCode?: string }) {
  return (
    <header className="ru-force-light sticky top-0 z-40 border-b border-[var(--ru-line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full bg-black object-cover"
          />
          <span className="min-w-0">
            <span className="block font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-black">
              {BRAND.appName}
            </span>
            {referenceCode ? (
              <span className="block truncate text-[11px] font-medium text-[var(--ru-muted)]">
                Trip {referenceCode}
              </span>
            ) : (
              <span className="block text-[11px] font-medium text-[var(--ru-muted)]">
                Live tracking
              </span>
            )}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/help"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--ru-elevated)]"
            aria-label="Help & support"
          >
            <HelpCircle className="h-5 w-5 text-[var(--ru-muted)]" />
          </Link>
          <Link
            href="/"
            className="ru-btn ru-btn-ghost !min-h-10 !px-3 !text-sm font-semibold text-black"
          >
            Home
          </Link>
        </div>
      </div>
    </header>
  );
}
