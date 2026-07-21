"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, Users, User, Wallet } from "lucide-react";

const TABS = [
  {
    href: "/driver/home",
    label: "Home",
    icon: Home,
    match: (p: string) => p === "/driver/home" || p === "/driver/home/",
  },
  {
    href: "/driver/jobs",
    label: "Jobs",
    icon: Briefcase,
    match: (p: string) => p.startsWith("/driver/jobs"),
  },
  {
    href: "/driver/group",
    label: "Groups",
    icon: Users,
    match: (p: string) => p.startsWith("/driver/group"),
  },
  {
    href: "/driver/earnings",
    label: "Earn",
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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-100 bg-white font-[system-ui,Segoe_UI,sans-serif]"
      style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Driver"
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
