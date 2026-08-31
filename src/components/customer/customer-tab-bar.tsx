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
  const hideOnMap =
    pathname.startsWith("/ride") || pathname.startsWith("/trip");
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
      className="fixed bottom-0 left-1/2 z-[60] w-full max-w-md -translate-x-1/2 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] font-[family-name:var(--font-sans)]"
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
                className={`uber-press flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 no-underline ${
                  active
                    ? "font-semibold text-[#111111]"
                    : "font-medium text-[#666666]"
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
                    fill={active ? "currentColor" : "none"}
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
