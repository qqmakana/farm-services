"use client";

import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { AppLink } from "@/components/ui/app-link";
import {
  dismissDriverWantedBanner,
  isDriverWantedBannerVisible,
} from "@/lib/driver-recruit";
import { getSelectedDriverId } from "@/lib/driver-session";

/**
 * Driver signup entry — Home (above the fold) & Account.
 * compact = one glance under “Where to?”; full = fuller pitch.
 */
export function DriveSignupCard({
  className = "",
  variant = "full",
  dismissible = false,
}: {
  className?: string;
  variant?: "full" | "compact";
  /** Home promo strip — dismiss for 7 days (Uber-style). */
  dismissible?: boolean;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (getSelectedDriverId()) {
      setVisible(false);
      return;
    }
    if (dismissible) {
      setVisible(isDriverWantedBannerVisible());
    }
  }, [dismissible]);

  if (!visible) return null;

  if (variant === "compact") {
    return (
      <section
        data-testid="drive-signup-card"
        data-variant="compact"
        className={`relative overflow-hidden rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${className}`}
      >
        <div className="flex min-h-[5.5rem] items-stretch">
          <div className="flex min-w-0 flex-[2] flex-col justify-center bg-[#f0c14b] px-5 py-4">
            <p className="text-[11px] font-semibold text-[#0a0a0a]/55">
              Opens end of September
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-[16px] font-bold leading-snug tracking-[-0.02em] text-[#0a0a0a]">
              Apply now — drivers keep 90%
            </p>
            <AppLink
              href="/driver/join"
              data-testid="home-drive-signup-cta"
              className="uber-press mt-3 inline-flex h-11 min-h-11 w-fit items-center gap-1 rounded-full bg-white px-4 text-sm font-bold text-[#0a0a0a] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            >
              Sign up to drive
              <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </AppLink>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#f6d56a]">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0%,transparent_62%)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/bell.png"
              alt=""
              width={88}
              height={88}
              className="relative h-[4.75rem] w-[4.75rem] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
        {dismissible ? (
          <button
            type="button"
            aria-label="Dismiss drivers wanted banner"
            data-testid="dismiss-home-promo"
            onClick={() => {
              dismissDriverWantedBanner();
              setVisible(false);
            }}
            className="uber-press absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section
      data-testid="drive-signup-card"
      data-variant="full"
      className={`rounded-2xl bg-black px-4 py-5 text-white ${className}`}
    >
      <p className="text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase">
        Drivers
      </p>
      <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white">
        Drive with Village Ride
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-white/75">
        Apply now. Paid Trip, Fetch, Send and Shops jobs start at the end of
        September. Keep 90% — cash or card to you. South Africa: SA ID only.
      </p>
      <AppLink
        href="/driver/join"
        data-testid="home-drive-signup-cta"
        className="uber-press mt-4 flex min-h-12 w-full items-center justify-center gap-1 rounded-full bg-white text-sm font-bold text-black hover:bg-gray-100 active:bg-gray-200"
      >
        Sign up to drive
        <ChevronRight className="h-4 w-4" aria-hidden />
      </AppLink>
      <p className="mt-3 text-center text-xs text-white/50">
        Already a driver?{" "}
        <AppLink
          href="/driver"
          className="font-semibold text-white underline underline-offset-2"
        >
          Open driver app
        </AppLink>
      </p>
    </section>
  );
}
