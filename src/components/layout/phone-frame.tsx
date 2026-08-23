import type { ReactNode } from "react";

/**
 * Desktop/tablet: app looks like a phone on a desk (max-w-md column).
 * Mobile: full width, no side gutters.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#F3F3F3]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

/** Shared classes for fixed chrome that must stay inside the phone column. */
export const PHONE_FIXED =
  "left-1/2 w-full max-w-md -translate-x-1/2";
