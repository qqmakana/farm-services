"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe, Menu, X } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { getGuestProfile } from "@/lib/guest-profile";
import { BRAND } from "@/lib/brand";

const PRIMARY = [
  { href: "/ride", label: "Ride", key: "book" },
  { href: "/driver/join", label: "Earn", key: "driver" },
  { href: "/merchant/dashboard", label: "Shop owner", key: "shop" },
  { href: "/shops", label: "Shops", key: "shops" },
] as const;

const ABOUT_LINKS = [
  { href: "/onboarding", label: "About us" },
  { href: "/pricing", label: "Our offerings" },
  { href: "/countries", label: "Countries" },
  { href: "/help", label: "Safety" },
  { href: "/terms", label: "Legal" },
  { href: "/privacy", label: "Privacy" },
] as const;

const MORE_LINKS = [
  { href: "/delivery", label: "Deliver", key: "delivery" },
  { href: "/farm", label: "Farm", key: "farm" },
  { href: "/courier", label: "Courier", key: "courier" },
  { href: "/merchant/register", label: "Register a shop", key: "shop-register" },
  { href: "/partners", label: "Partners", key: "partners-more" },
  { href: "/driver/join", label: "Drive", key: "driver-more" },
  { href: "/pricing", label: "Pricing", key: "pricing" },
  { href: "/help", label: "Help", key: "help" },
  { href: "/dispatch", label: "Ops", key: "dispatch" },
  { href: "/admin/dashboard", label: "Admin", key: "admin" },
] as const;

export function SiteNav({
  active,
}: {
  active?: string;
}) {
  const { locale } = useCountry();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [guestName, setGuestName] = useState("");
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGuestName(getGuestProfile()?.name?.trim().split(/\s+/)[0] ?? "");
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!aboutRef.current?.contains(e.target as Node)) setAboutOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

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

  const moreLinks = MORE_LINKS.filter((l) => {
    if (l.key === "admin" || l.key === "dispatch") return showAdmin;
    return true;
  });

  const lang = (locale || "en").slice(0, 2).toUpperCase();

  return (
    <>
      <header className="ru-force-light sticky top-0 z-40 bg-white text-[#0a0a0a]">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link
            href="/"
            className="shrink-0 text-[1.15rem] font-bold tracking-tight text-[#0a0a0a]"
          >
            {BRAND.appName}
          </Link>

          <nav
            className="flex min-w-0 flex-1 items-center gap-1 text-sm font-medium"
            aria-label="Primary"
          >
            {PRIMARY.map((link) => {
              const isActive = active === link.key;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-2.5 py-1.5 sm:px-3 ${
                    isActive
                      ? "bg-[#0a0a0a] font-semibold text-white"
                      : "text-[#0a0a0a] hover:bg-[#f4f4f5]"
                  } ${link.key === "shop" || link.key === "shops" ? "hidden min-[420px]:inline-flex" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="relative hidden min-[420px]:block" ref={aboutRef}>
              <button
                type="button"
                onClick={() => setAboutOpen((v) => !v)}
                className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1.5 text-[#0a0a0a] hover:bg-[#f4f4f5]"
                aria-expanded={aboutOpen}
              >
                About
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              {aboutOpen ? (
                <div className="absolute top-full left-0 z-50 mt-1 w-44 rounded-xl bg-white py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
                  {ABOUT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAboutOpen(false)}
                      className="block px-4 py-2 text-sm text-[#0a0a0a] hover:bg-[#f4f4f5]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href="/account"
              className="hidden items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-[#0a0a0a] hover:bg-[#f4f4f5] min-[380px]:inline-flex"
              aria-label="Language"
            >
              <Globe className="h-4 w-4" strokeWidth={2} aria-hidden />
              {lang}
            </Link>
            <Link
              href="/help"
              className="hidden rounded-full px-2.5 py-1.5 text-sm font-medium text-[#0a0a0a] hover:bg-[#f4f4f5] sm:inline-flex"
            >
              Help
            </Link>
            <Link
              href={guestName ? "/account" : "/login"}
              className="inline-flex max-w-[7.5rem] items-center gap-1 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-sm font-semibold text-white"
            >
              <span className="truncate">{guestName || "Log in"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f4f4f5]"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <aside
          className={`ru-force-light absolute top-0 right-0 flex h-full w-[min(100%,320px)] flex-col bg-white text-[#0a0a0a] shadow-xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-lg font-bold">{BRAND.appName}</span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f4f4f5]"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {PRIMARY.map((link) => (
              <Link
                key={`m-${link.href}`}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`mb-1 block rounded-xl px-4 py-3.5 text-base font-medium ${
                  active === link.key
                    ? "bg-[#0a0a0a] font-semibold text-white"
                    : "hover:bg-[#f4f4f5]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {ABOUT_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="mb-1 block rounded-xl px-4 py-3 text-base font-medium hover:bg-[#f4f4f5]"
              >
                {item.label}
              </Link>
            ))}
            {moreLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setOpen(false)}
                className="mb-1 block rounded-xl px-4 py-3 text-base font-medium hover:bg-[#f4f4f5]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
