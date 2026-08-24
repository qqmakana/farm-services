"use client";

import type { AnchorHTMLAttributes } from "react";

/** Plain link — full page load. Do not intercept clicks (breaks Hisense / TWA). */
export function AppLink({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
