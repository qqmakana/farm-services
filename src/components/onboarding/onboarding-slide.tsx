"use client";

import type { ReactNode } from "react";

export type OnboardingSlideData = {
  id: string;
  title: string;
  description: string;
  art: ReactNode;
};

export function OnboardingSlide({
  slide,
  active,
}: {
  slide: OnboardingSlideData;
  active: boolean;
}) {
  return (
    <div
      className={`flex h-full w-full shrink-0 flex-col px-6 transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-40"
      }`}
      aria-hidden={!active}
    >
      <div className="flex flex-1 items-center justify-center pt-6 pb-4">
        <div className="relative w-full max-w-[320px]">{slide.art}</div>
      </div>
      <div className="mx-auto w-full max-w-md pb-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] leading-tight font-bold tracking-tight text-black sm:text-[32px]">
          {slide.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--ru-muted)]">
          {slide.description}
        </p>
      </div>
    </div>
  );
}

/** Soft map + phone tap — request */
export function ArtRequest() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="vr-req-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#F6F6F6" />
        </linearGradient>
      </defs>
      <rect width="320" height="280" rx="32" fill="url(#vr-req-sky)" />
      {/* soft map grid */}
      <g stroke="#1A4D3A" strokeOpacity="0.08" strokeWidth="1.5">
        <path d="M40 90h240M40 140h240M40 190h240" />
        <path d="M90 50v180M160 50v180M230 50v180" />
      </g>
      {/* phone */}
      <rect
        x="108"
        y="58"
        width="104"
        height="168"
        rx="18"
        fill="#111"
      />
      <rect x="116" y="72" width="88" height="128" rx="8" fill="#fff" />
      <circle cx="160" cy="212" r="6" fill="#333" />
      {/* destination pin */}
      <g transform="translate(148 98)">
        <path
          d="M24 0c-10 0-18 8-18 18 0 14 18 34 18 34s18-20 18-34c0-10-8-18-18-18z"
          fill="#1A4D3A"
        />
        <circle cx="24" cy="17" r="6" fill="#fff" />
      </g>
      {/* tap pulse */}
      <circle cx="210" cy="170" r="18" fill="#0ECB81" fillOpacity="0.2" />
      <circle cx="210" cy="170" r="10" fill="#0ECB81" />
    </svg>
  );
}

/** Match / connect */
export function ArtConnect() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <rect width="320" height="280" rx="32" fill="#F0F7F3" />
      {/* driver card */}
      <rect
        x="48"
        y="72"
        width="224"
        height="136"
        rx="20"
        fill="#fff"
        stroke="#EAEAEA"
        strokeWidth="2"
      />
      <circle cx="96" cy="128" r="28" fill="#1A4D3A" />
      <text
        x="96"
        y="134"
        textAnchor="middle"
        fill="#fff"
        fontSize="22"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        D
      </text>
      <rect x="140" y="108" width="100" height="12" rx="6" fill="#1A1A1A" />
      <rect x="140" y="130" width="72" height="10" rx="5" fill="#D1D1D1" />
      <rect x="140" y="156" width="88" height="28" rx="14" fill="#0ECB81" />
      <text
        x="184"
        y="175"
        textAnchor="middle"
        fill="#fff"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        ACCEPT
      </text>
      {/* check badge */}
      <circle cx="248" cy="84" r="22" fill="#0ECB81" />
      <path
        d="M238 84l6 6 14-14"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Complete / rate */
export function ArtDone() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <rect width="320" height="280" rx="32" fill="#F6F6F6" />
      {/* soft road */}
      <path
        d="M0 200c60-40 100-40 160 0s100 40 160 0v80H0z"
        fill="#E8EEE9"
      />
      {/* bakkie / car body */}
      <g transform="translate(70 118)">
        <rect x="20" y="36" width="140" height="40" rx="10" fill="#1A4D3A" />
        <path d="M50 36h70l18 28H40z" fill="#0F3328" />
        <rect x="58" y="42" width="28" height="16" rx="3" fill="#B8D4C4" />
        <rect x="98" y="42" width="28" height="16" rx="3" fill="#B8D4C4" />
        <circle cx="52" cy="78" r="14" fill="#1A1A1A" />
        <circle cx="52" cy="78" r="6" fill="#888" />
        <circle cx="148" cy="78" r="14" fill="#1A1A1A" />
        <circle cx="148" cy="78" r="6" fill="#888" />
        {/* package on bed */}
        <rect x="128" y="18" width="36" height="28" rx="4" fill="#FFB020" />
        <path d="M128 28h36" stroke="#fff" strokeWidth="2" />
      </g>
      {/* stars */}
      <g fill="#0ECB81">
        <path d="M160 48l4 10h11l-9 7 3 11-9-6-9 6 3-11-9-7h11z" />
        <path
          d="M200 56l3 8h9l-7 5 3 8-8-5-8 5 3-8-7-5h9z"
          fillOpacity="0.7"
        />
        <path
          d="M120 56l3 8h9l-7 5 3 8-8-5-8 5 3-8-7-5h9z"
          fillOpacity="0.7"
        />
      </g>
    </svg>
  );
}
