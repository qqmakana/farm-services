"use client";

import { AppLink } from "@/components/ui/app-link";
import { UBER_BADGE, UBER_CIRCLE } from "@/components/customer/uber-chrome";

export function UberServiceCircle({
  href,
  label,
  src,
  badge,
  size = 64,
  testId,
  primary = false,
}: {
  href: string;
  label: string;
  src: string;
  badge?: string;
  size?: number;
  testId?: string;
  primary?: boolean;
}) {
  const img = Math.round(size * 0.72);
  return (
    <AppLink
      href={href}
      data-testid={testId}
      data-primary={primary ? "true" : undefined}
      aria-current={primary ? "page" : undefined}
      className="uber-press relative flex min-h-12 w-full flex-col items-center justify-start"
    >
      {badge ? (
        <span
          className={`absolute -top-2 left-1/2 z-10 -translate-x-1/2 ${UBER_BADGE}`}
        >
          {badge}
        </span>
      ) : null}
      <span className={UBER_CIRCLE} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={img}
          height={img}
          className="pointer-events-none object-contain"
        />
      </span>
      <span className="mt-2 text-center text-[13px] font-semibold text-[#0a0a0a]">
        {label}
      </span>
    </AppLink>
  );
}
