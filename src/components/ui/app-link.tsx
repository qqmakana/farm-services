"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

/**
 * Full-page navigation. Play Store TWA and older Android WebViews (Hisense)
 * often fail Next.js client-side routing and show "Try again".
 */
export function AppLink({
  href,
  children,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function go(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    window.location.assign(href);
  }

  return (
    <a href={href} onClick={go} {...rest}>
      {children}
    </a>
  );
}
