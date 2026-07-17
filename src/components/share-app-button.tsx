"use client";

import { NavInstallShare } from "@/components/install-share-bar";

/** Thin wrapper so SiteNav (server) can render client install/share controls. */
export function ShareAppButton({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <NavInstallShare />
    </span>
  );
}
