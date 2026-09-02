"use client";

import { AppLink } from "@/components/ui/app-link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  // Map booking screens need the full viewport for pin taps.
  const hideOnMap =
    pathname.startsWith("/ride") ||
    pathname.startsWith("/trip") ||
    pathname.startsWith("/courier") ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/farm");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    applySimpleModeClass();
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      setKeyboardOpen(window.innerHeight - vv.height > 120);
    };
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  if (hideOnMap || keyboardOpen) return null;

  return (
    <nav
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-[22rem] -translate-x-1/2 rounded-full bg-white px-2 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] font-[family-name:var(--font-sans)]"
      aria-label="Main"
      data-testid="customer-tab-bar"
    >
      <ul className="flex h-14 items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <AppLink
                href={tab.href}
                data-testid={`customer-tab-${tab.label.toLowerCase()}`}
                className={`uber-press flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 no-underline transition-colors duration-200 ${
                  active
                    ? "font-semibold text-[#111111]"
                    : "font-medium text-[#6B6B6B]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 ${
                    active ? "bg-[#111111] text-white" : "bg-transparent"
                  }`}
                >
                  <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 2.25 : 2}
                    fill={active ? "currentColor" : "none"}
                    aria-hidden
                  />
                </span>
                <span className="text-[10px] font-semibold leading-none tracking-[0.2px]">
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
