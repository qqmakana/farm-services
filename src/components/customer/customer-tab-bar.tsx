"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Grid2X2, Home, Receipt, User } from "lucide-react";
import { applySimpleModeClass } from "@/lib/simple-mode";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: (p: string) => p === "/",
  },
  {
    href: "/services",
    label: "Services",
    icon: Grid2X2,
    match: (p: string) =>
      p.startsWith("/services") ||
      p.startsWith("/farm") ||
      p.startsWith("/courier") ||
      p.startsWith("/shops") ||
      p.startsWith("/shop") ||
      p.startsWith("/group"),
  },
  {
    href: "/activity",
    label: "Activity",
    icon: Receipt,
    match: (p: string) => p.startsWith("/activity"),
  },
  {
    href: "/account",
    label: "Account",
    icon: User,
    match: (p: string) => p.startsWith("/account"),
  },
] as const;

export function CustomerTabBar() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    applySimpleModeClass();
  }, []);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-md border-t border-[#EEEEEE] bg-white pb-[env(safe-area-inset-bottom)] font-[family-name:var(--font-sans)]"
      aria-label="Main"
      data-testid="customer-tab-bar"
    >
      <ul className="flex h-16 items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                data-testid={`customer-tab-${tab.label.toLowerCase()}`}
                className={`uber-press flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 ${
                  active
                    ? "font-semibold text-black"
                    : "font-medium text-[#6B6B6B]"
                }`}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={2}
                  fill={active ? "currentColor" : "none"}
                  aria-hidden
                />
                <span className="text-[11px] font-semibold leading-none tracking-[0.5px]">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
