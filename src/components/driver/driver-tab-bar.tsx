"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, User, Wallet } from "lucide-react";

const TABS = [
  {
    href: "/driver/home",
    label: "Jobs",
    icon: MapPin,
    match: (p: string) =>
      p.startsWith("/driver/home") ||
      p.startsWith("/driver/jobs") ||
      p.startsWith("/driver/group"),
  },
  {
    href: "/driver/earnings",
    label: "Earnings",
    icon: Wallet,
    match: (p: string) => p.startsWith("/driver/earnings"),
  },
  {
    href: "/driver/account",
    label: "Account",
    icon: User,
    match: (p: string) => p.startsWith("/driver/account"),
  },
] as const;

export function DriverTabBar() {
  const pathname = usePathname() ?? "/driver/home";

  if (pathname.startsWith("/driver/guide")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--ru-line)] bg-white/95 font-[family-name:var(--font-sans)] backdrop-blur"
      style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Driver"
      data-testid="driver-tab-bar"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                data-testid={`driver-tab-${tab.label.toLowerCase()}`}
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
