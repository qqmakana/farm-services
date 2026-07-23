"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, User, Bell } from "lucide-react";
import { ShareAppButton } from "@/components/share-app-button";
import { ThemeToggle } from "@/components/theme-provider";
import { BRAND } from "@/lib/brand";

const links = [
  { href: "/", label: "Home", key: "home" },
  { href: "/ride", label: "Ride", key: "book" },
  { href: "/delivery", label: "Deliver", key: "delivery" },
  { href: "/courier", label: "Courier", key: "courier" },
  { href: "/farm", label: "Farm", key: "farm" },
  { href: "/shops", label: "Buy", key: "shops" },
  { href: "/driver/join", label: "Drive", key: "driver" },
  { href: "/partners", label: "Partners", key: "partners" },
  { href: "/pricing", label: "Pricing", key: "pricing" },
  { href: "/shop", label: "Sell", key: "shop" },
  { href: "/help", label: "Help", key: "help" },
  { href: "/dispatch", label: "Ops", key: "dispatch" },
  { href: "/admin/dashboard", label: "Admin", key: "admin" },
] as const;

export function SiteNav({
  active,
}: {
  active?: (typeof links)[number]["key"];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/check")
      .then((r) => r.json())
      .then((j: { ok?: boolean }) => {
        if (!cancelled) setShowAdmin(Boolean(j.ok));
      })
      .catch(() => {
        if (!cancelled) setShowAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const navLinks = links.filter((l) => {
    if (l.key === "admin" || l.key === "dispatch") return showAdmin;
    return true;
  });

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b bg-white/95 text-black backdrop-blur transition-shadow ${
          scrolled
            ? "border-[var(--ru-line)] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            : "border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </span>
            <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight sm:text-lg">
              {BRAND.appName}
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 text-sm lg:flex">
            {navLinks.slice(0, 8).map((link) => {
              const isActive = active === link.key;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-2 font-semibold transition ${
                    isActive
                      ? "bg-black text-white"
                      : "text-[var(--ru-muted)] hover:bg-[#f0f0f0] hover:text-black"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[#f0f0f0] sm:flex"
              aria-label="Account"
            >
              <User className="h-5 w-5 text-[var(--ru-muted)]" />
            </Link>
            <Link
              href="/merchant/dashboard"
              className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[#f0f0f0] md:flex"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-[var(--ru-muted)]" />
            </Link>
            <ShareAppButton className="hidden sm:inline-flex" />
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#f0f0f0] lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute top-0 right-0 flex h-full w-[min(100%,320px)] flex-col bg-white shadow-xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--ru-line)] px-4 py-4">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold">
              Menu
            </span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f0f0f0]"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {navLinks.map((link) => {
              const isActive = active === link.key;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`mb-1 block rounded-2xl px-4 py-3.5 text-base font-semibold transition ${
                    isActive
                      ? "bg-black text-white"
                      : "text-black hover:bg-[#f5f5f5]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-[var(--ru-line)] p-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="ru-btn ru-btn-primary ru-btn-block"
            >
              Sign in
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
