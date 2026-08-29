"use client";

import { AppLink } from "@/components/ui/app-link";
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
      p.startsWith("/group") ||
      p.startsWith("/ride") ||
      p.startsWith("/delivery") ||
      p.startsWith("/safety"),
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
  const hideOnMap =
    pathname.startsWith("/ride") || pathname.startsWith("/trip");

  useEffect(() => {
    applySimpleModeClass();
  }, []);

  if (hideOnMap) return null;

  return (
    <nav
      className="fixed bottom-[max(0.4rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-[calc(100%-1.25rem)] max-w-md -translate-x-1/2 rounded-[28px] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] font-[family-name:var(--font-sans)]"
      aria-label="Main"
      data-testid="customer-tab-bar"
    >
      <ul className="flex h-16 items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <AppLink
                href={tab.href}
                data-testid={`customer-tab-${tab.label.toLowerCase()}`}
                className={`uber-press flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 ${
                  active
                    ? "font-semibold text-black"
                    : "font-medium text-[#6B6B6B]"
                }`}
              >
                <span
                  className={`flex h-9 w-14 items-center justify-center rounded-full ${
                    active ? "bg-[#EEEEEE]" : ""
                  }`}
                >
                  <Icon
                    className="h-6 w-6"
                    strokeWidth={active ? 2.25 : 2}
                    fill="none"
                    aria-hidden
                  />
                </span>
                <span className="text-[11px] font-semibold leading-none tracking-[0.5px]">
                  {tab.label}
                </span>
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
