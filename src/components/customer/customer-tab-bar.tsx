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
      className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-md border-t border-[#e8e8e8] bg-white pb-[env(safe-area-inset-bottom)] font-[family-name:var(--font-display)]"
      aria-label="Main"
      data-testid="customer-tab-bar"
    >
      <ul className="flex h-[3.65rem] items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                data-testid={`customer-tab-${tab.label.toLowerCase()}`}
                className={`uber-press flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 ${
                  active
                    ? "font-semibold text-[#0a0a0a]"
                    : "font-medium text-[#6b6b6b]"
                }`}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.4 : 1.75}
                  fill={active ? "currentColor" : "none"}
                  aria-hidden
                />
                <span className="text-[10px] leading-none tracking-[0.01em]">
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
