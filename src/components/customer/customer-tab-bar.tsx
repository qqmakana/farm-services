"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, User } from "lucide-react";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: (p: string) =>
      p === "/" ||
      p.startsWith("/ride") ||
      p.startsWith("/delivery") ||
      p.startsWith("/courier") ||
      p.startsWith("/farm") ||
      p.startsWith("/shops") ||
      p.startsWith("/shop") ||
      p.startsWith("/group") ||
      p.startsWith("/services"),
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
                className={`uber-press flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-3 hover:bg-gray-50 active:bg-gray-100 ${
                  active
                    ? "font-semibold text-black"
                    : "font-medium text-gray-500"
                }`}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.25 : 1.75}
                  fill={active ? "currentColor" : "none"}
                  aria-hidden
                />
                <span className="text-xs leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
