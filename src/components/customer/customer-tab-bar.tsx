"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Grid2X2, Home, User } from "lucide-react";

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
    icon: Clock,
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

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-[60] w-full max-w-md -translate-x-1/2 touch-manipulation border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] font-[family-name:var(--font-sans)]"
      style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Main"
      data-testid="customer-tab-bar"
    >
      <ul className="mx-auto flex h-16 w-full items-stretch justify-around px-1">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                data-testid={`customer-tab-${tab.label.toLowerCase()}`}
                className={`uber-press flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-none py-2 ${
                  active
                    ? "font-semibold text-black"
                    : "font-medium text-gray-500"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    active ? "bg-gray-100" : ""
                  }`}
                >
                  <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 2.5 : 1.75}
                    fill={active ? "currentColor" : "none"}
                    aria-hidden
                  />
                </span>
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
