"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Grid2X2, Home, Receipt, User } from "lucide-react";
import { applySimpleModeClass } from "@/lib/simple-mode";

const ICON = 2;

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
      className="fixed bottom-3 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 touch-manipulation pb-[env(safe-area-inset-bottom)] font-sans"
      aria-label="Main"
      data-testid="customer-tab-bar"
    >
      <ul className="flex h-[4.25rem] items-stretch justify-around rounded-[9999px] bg-white px-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)]">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                data-testid={`customer-tab-${tab.label.toLowerCase()}`}
                className={`uber-press mx-0.5 flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[9999px] py-1.5 ${
                  active
                    ? "bg-[#eeeeee] font-semibold text-[#0a0a0a]"
                    : "font-medium text-[#71717a]"
                }`}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={ICON}
                  aria-hidden
                />
                <span className="text-[10px] leading-none tracking-wide">
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
