"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, MapPin, User } from "lucide-react";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: MapPin,
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
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--ru-line)] bg-white/95 pb-[env(safe-area-inset-bottom)] font-[family-name:var(--font-sans)] backdrop-blur"
      style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Main"
      data-testid="customer-tab-bar"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                data-testid={`customer-tab-${tab.label.toLowerCase()}`}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                  active
                    ? "font-bold text-black"
                    : "font-medium text-[var(--ru-muted)]"
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
