"use client";

import type { ReactNode } from "react";
import { AppLink } from "@/components/ui/app-link";
import { UBER_BADGE, UBER_TILE } from "@/components/customer/uber-chrome";

/** Square Uber Services tile: gray card, 3D icon, label underneath. */
export function UberServiceTile({
  href,
  label,
  src,
  art,
  badge,
  testId,
  knockoutWhite = false,
  primary = false,
  tileClassName,
}: {
  href: string;
  label: string;
  src?: string;
  art?: ReactNode;
  badge?: string;
  testId?: string;
  knockoutWhite?: boolean;
  primary?: boolean;
  tileClassName?: string;
}) {
  return (
    <AppLink
      href={href}
      data-testid={testId}
      data-primary={primary ? "true" : undefined}
      aria-current={primary ? "page" : undefined}
      className="uber-press flex min-h-12 flex-col items-center"
    >
      <span className={`${UBER_TILE} ${tileClassName ?? ""}`}>
        {badge ? (
          <span className={`absolute top-1.5 left-1.5 z-10 ${UBER_BADGE}`}>
            {badge}
          </span>
        ) : null}
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={`pointer-events-none relative z-[1] h-[78%] w-[78%] object-contain ${
              knockoutWhite
                ? "mix-blend-multiply drop-shadow-[0_8px_14px_rgba(0,0,0,0.18)]"
                : "drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]"
            }`}
          />
        ) : (
          art
        )}
      </span>
      <span className="mt-2 px-0.5 text-center text-[12px] font-semibold leading-tight text-[#0a0a0a]">
        {label}
      </span>
    </AppLink>
  );
}

/** Wider Uber card used under “Get Courier to help”. */
export function UberFeatureTile({
  href,
  title,
  sub,
  src,
  testId,
}: {
  href: string;
  title: string;
  sub: string;
  src: string;
  testId?: string;
}) {
  return (
    <AppLink
      href={href}
      data-testid={testId}
      className="uber-press flex min-h-[8.25rem] flex-col justify-between rounded-[16px] bg-[#F3F3F3] p-4"
    >
      <span>
        <span className="block text-[15px] font-bold text-[#0a0a0a]">
          {title}
        </span>
        <span className="mt-1 block text-[13px] font-medium leading-snug text-[#6B6B6B]">
          {sub}
        </span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="mt-3 h-14 w-14 self-end object-contain mix-blend-multiply drop-shadow-[0_6px_10px_rgba(0,0,0,0.12)]"
      />
    </AppLink>
  );
}

export function ArtForYou() {
  return (
    <svg viewBox="0 0 64 64" className="h-[58%] w-[58%]" aria-hidden>
      <circle cx="32" cy="32" r="22" fill="#276EF1" />
      <path
        d="M32 16l4.2 12.2L48 32l-11.8 3.8L32 48l-4.2-12.2L16 32l11.8-3.8z"
        fill="#fff"
      />
    </svg>
  );
}

export function ArtCourier() {
  return (
    <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" aria-hidden>
      <rect x="8" y="18" width="48" height="32" rx="4" fill="#fff" stroke="#D2D2D2" strokeWidth="2" />
      <path d="M8 22l24 16 24-16" fill="none" stroke="#276EF1" strokeWidth="3" />
      <rect x="38" y="36" width="14" height="10" rx="2" fill="#F6C90E" />
    </svg>
  );
}

export function ArtReserve() {
  return (
    <svg viewBox="0 0 64 64" className="h-[58%] w-[58%]" aria-hidden>
      <rect x="10" y="16" width="44" height="38" rx="6" fill="#fff" />
      <rect x="10" y="16" width="44" height="12" rx="6" fill="#E11900" />
      <rect x="10" y="22" width="44" height="6" fill="#E11900" />
      <rect x="20" y="12" width="5" height="10" rx="2" fill="#1A1A1A" />
      <rect x="39" y="12" width="5" height="10" rx="2" fill="#1A1A1A" />
      <rect x="18" y="34" width="8" height="8" rx="1.5" fill="#E8E8E8" />
      <rect x="28" y="34" width="8" height="8" rx="1.5" fill="#E8E8E8" />
      <rect x="38" y="34" width="8" height="8" rx="1.5" fill="#276EF1" />
      <rect x="18" y="44" width="8" height="8" rx="1.5" fill="#E8E8E8" />
      <rect x="28" y="44" width="8" height="8" rx="1.5" fill="#E8E8E8" />
    </svg>
  );
}

export function ArtGroups() {
  return (
    <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" aria-hidden>
      <circle cx="24" cy="22" r="9" fill="#276EF1" />
      <path d="M8 50c0-9 7-14 16-14s16 5 16 14" fill="#276EF1" />
      <circle cx="42" cy="24" r="8" fill="#06C167" />
      <path d="M28 50c0-8 6-13 14-13s14 5 14 13" fill="#06C167" />
    </svg>
  );
}

export function ArtGrocery() {
  return (
    <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" aria-hidden>
      <path
        d="M14 22h36l-4 28H18L14 22z"
        fill="#E11900"
        stroke="#9B0000"
        strokeWidth="1.5"
      />
      <path d="M20 22c0-8 4-14 12-14s12 6 12 14" fill="none" stroke="#1A1A1A" strokeWidth="3" />
      <rect x="24" y="30" width="6" height="12" rx="1" fill="#fff" opacity="0.85" />
      <rect x="34" y="28" width="6" height="14" rx="1" fill="#F6C90E" />
    </svg>
  );
}

export function ArtHardware() {
  return (
    <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" aria-hidden>
      <rect x="12" y="28" width="40" height="24" rx="4" fill="#C4A574" />
      <rect x="12" y="22" width="40" height="10" rx="3" fill="#A67C52" />
      <rect x="28" y="14" width="8" height="12" rx="2" fill="#6B6B6B" />
    </svg>
  );
}

export function ArtSpaza() {
  return (
    <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" aria-hidden>
      <rect x="12" y="26" width="40" height="26" rx="3" fill="#276EF1" />
      <path d="M8 26h48l-6-12H14L8 26z" fill="#E11900" />
      <rect x="26" y="36" width="12" height="16" fill="#F6C90E" />
      <rect x="16" y="34" width="8" height="8" fill="#fff" />
      <rect x="40" y="34" width="8" height="8" fill="#fff" />
    </svg>
  );
}

export function ArtFeed() {
  return (
    <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" aria-hidden>
      <path d="M20 14h24l4 10v28c0 3-3 6-8 6H24c-5 0-8-3-8-6V24l4-10z" fill="#06C167" />
      <path d="M20 14h24v8H20z" fill="#0A8F4A" />
      <circle cx="32" cy="40" r="8" fill="#F6C90E" />
    </svg>
  );
}

export function ArtClinic() {
  return (
    <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" aria-hidden>
      <rect x="22" y="10" width="20" height="44" rx="6" fill="#fff" stroke="#D2D2D2" strokeWidth="2" />
      <rect x="28" y="6" width="8" height="8" rx="2" fill="#06C167" />
      <rect x="30" y="24" width="4" height="16" rx="1" fill="#E11900" />
      <rect x="24" y="30" width="16" height="4" rx="1" fill="#E11900" />
    </svg>
  );
}
