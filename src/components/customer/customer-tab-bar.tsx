"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, LayoutGrid, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/services",
    label: "Services",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/services"),
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
      className="fixed inset-x-0 bottom-0 z-[60] h-16 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] font-[system-ui,Segoe_UI,sans-serif]"
      style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Main"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                  active
                    ? "font-bold text-[#1A4D3A]"
                    : "font-normal text-[#6B7280]"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden
                />
                <span className="text-[11px] leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
