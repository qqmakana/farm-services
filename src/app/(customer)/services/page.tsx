"use client";

import { useState, type ReactNode } from "react";
import { AppLink } from "@/components/ui/app-link";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import {
  ChevronRight,
  FileText,
  Package,
  Refrigerator,
  Search,
  ShoppingBag,
  Sofa,
} from "lucide-react";

type ServicesTab = "ride" | "send" | "fetch" | "shops";

const TABS: {
  id: ServicesTab;
  label: string;
  src: string;
}[] = [
  { id: "ride", label: "Ride", src: "/home/icons/car.png" },
  { id: "send", label: "Send", src: "/home/icons/courier.png" },
  { id: "fetch", label: "Fetch", src: "/home/icons/courier.png" },
  { id: "shops", label: "Shops", src: "/home/icons/shops.png" },
];

function RowLink({
  href,
  icon,
  title,
  testId,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  testId?: string;
}) {
  return (
    <AppLink
      href={href}
      data-testid={testId}
      className="uber-press flex min-h-14 items-center gap-3 px-4 py-3 text-left no-underline"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#F3F3F3]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-[16px] font-semibold text-[#111111]">
        {title}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#C4C4C4]" aria-hidden />
    </AppLink>
  );
}

function ServicesContent() {
  const [tab, setTab] = useState<ServicesTab>("ride");
  const searchLabel =
    tab === "send" || tab === "fetch" || tab === "shops"
      ? "Deliver to?"
      : "Where to?";
  const searchHref =
    tab === "shops"
      ? "/shops"
      : tab === "send"
        ? "/courier"
        : tab === "fetch"
          ? "/delivery"
          : "/ride";

  return (
    <main
      data-testid="uber-services"
      className="vr-page-enter ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] font-[family-name:var(--font-sans)] tracking-[-0.02em] text-[#111111]"
    >
      {/* Uber Courier-style top tabs */}
      <div
        className="flex items-end justify-around border-b border-[#EEEEEE]"
        role="tablist"
        aria-label="Ride, Send, Fetch, Shops"
      >
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={`uber-press relative flex min-h-14 flex-1 flex-col items-center gap-1 pb-2.5 text-[14px] ${
                on
                  ? "font-bold text-[#111111]"
                  : "font-medium text-[#6B6B6B]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.src}
                alt=""
                className={`h-8 w-8 object-contain ${
                  t.id !== "ride" ? "mix-blend-multiply opacity-90" : ""
                }`}
              />
              {t.label}
              {on ? (
                <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-black" />
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[15px] font-medium leading-snug text-[#6B6B6B]">
        Transport for everywhere — villages, towns, cities
      </p>

      <AppLink
        href={searchHref}
        className="uber-press mt-4 flex h-12 items-center gap-3 rounded-full bg-[#EEEEEE] px-4 no-underline"
      >
        <Search className="h-5 w-5 shrink-0 text-[#6B6B6B]" strokeWidth={2} />
        <span className="text-[16px] font-medium text-[#6B6B6B]">
          {searchLabel}
        </span>
      </AppLink>

      {tab === "ride" ? (
        <section className="mt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                Rides for everyone
              </h2>
              <p className="mt-1 text-[14px] text-[#6B6B6B]">
                Village to town · Town to city · Village to village
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/car.png"
              alt=""
              className="h-14 w-14 shrink-0 object-contain"
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-[#EEEEEE]">
            <RowLink
              href="/ride"
              testId="service-circle-trip"
              title="Trip to campus or town"
              icon={
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/home/icons/car.png" alt="" className="h-7 w-7" />
              }
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/ride?when=later"
              testId="service-circle-reserve"
              title="Reserve a ride later"
              icon={<CalendarGlyph />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/ride?seats=2"
              testId="service-circle-groups"
              title="Group rides (split the cost)"
              icon={<PeopleGlyph />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/ride?stop=1"
              testId="service-circle-trip-stop"
              title="Trip + stop"
              icon={<StopGlyph />}
            />
          </div>
        </section>
      ) : null}

      {tab === "send" ? (
        <section className="mt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                Send anything, anywhere
              </h2>
              <p className="mt-1 text-[14px] text-[#6B6B6B]">
                Documents · Packages · Small items
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/courier.png"
              alt=""
              className="h-14 w-14 shrink-0 object-contain mix-blend-multiply"
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-[#EEEEEE]">
            <RowLink
              href="/courier"
              testId="service-circle-courier"
              title="Documents → Car"
              icon={<FileText className="h-5 w-5" strokeWidth={2} />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/courier"
              testId="service-circle-send-items"
              title="Small items → Car"
              icon={<Package className="h-5 w-5" strokeWidth={2} />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/courier"
              title="Large items → Bakkie"
              icon={<ShoppingBag className="h-5 w-5" strokeWidth={2} />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/courier"
              title="Fridge · Furniture → Bakkie"
              icon={<Refrigerator className="h-5 w-5" strokeWidth={2} />}
            />
          </div>

          <h3 className="mt-8 text-[20px] font-bold">Your tasks done fast</h3>
          <div className="vr-hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <AppLink
              href="/courier"
              className="uber-press inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E0E0E0] bg-[#F6F6F6] px-4 py-2.5 text-[14px] font-semibold text-[#111111] no-underline"
            >
              <FileText className="h-4 w-4" />
              Send documents
            </AppLink>
            <AppLink
              href="/courier"
              className="uber-press inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E0E0E0] bg-[#F6F6F6] px-4 py-2.5 text-[14px] font-semibold text-[#111111] no-underline"
            >
              <Sofa className="h-4 w-4" />
              Move furniture
            </AppLink>
          </div>
        </section>
      ) : null}

      {tab === "fetch" ? (
        <section className="mt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                Shop &amp; deliver
              </h2>
              <p className="mt-1 text-[14px] text-[#6B6B6B]">
                Local shops · Groceries · Hardware
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/courier.png"
              alt=""
              className="h-14 w-14 shrink-0 object-contain mix-blend-multiply"
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-[#EEEEEE]">
            <RowLink
              href="/delivery"
              testId="service-circle-delivery"
              title="Groceries"
              icon={<ShoppingBag className="h-5 w-5" strokeWidth={2} />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/delivery"
              title="Hardware"
              icon={<Package className="h-5 w-5" strokeWidth={2} />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/delivery"
              testId="service-circle-store-pickup"
              title="Save yourself a trip"
              icon={<ShoppingBag className="h-5 w-5" strokeWidth={2} />}
            />
            <div className="mx-4 border-t border-[#EEEEEE]" />
            <RowLink
              href="/farm"
              testId="service-circle-farm"
              title="Farm produce"
              icon={
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/home/icons/farm.png"
                  alt=""
                  className="h-7 w-7 mix-blend-multiply"
                />
              }
            />
          </div>

          <h3 className="mt-8 text-[20px] font-bold">Save yourself a trip</h3>
          <AppLink
            href="/shops"
            className="uber-press uber-press-card mt-3 flex items-center justify-between rounded-[16px] bg-[#F6F6F6] px-4 py-4 no-underline"
          >
            <span>
              <span className="block text-[16px] font-bold text-[#111111]">
                Store pick-ups
              </span>
              <span className="mt-0.5 block text-[14px] text-[#6B6B6B]">
                Get purchases delivered
              </span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/shops.png"
              alt=""
              className="h-14 w-14 object-contain mix-blend-multiply"
            />
          </AppLink>
        </section>
      ) : null}

      {tab === "shops" ? (
        <section className="mt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                Browse local shops
              </h2>
              <p className="mt-1 text-[14px] text-[#6B6B6B]">
                Support local businesses
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/shops.png"
              alt=""
              className="h-14 w-14 shrink-0 object-contain mix-blend-multiply"
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-[#EEEEEE]">
            {(
              [
                ["Groceries", "/shops"],
                ["Hardware", "/shops"],
                ["Farm produce", "/shops"],
                ["Furniture", "/shops"],
                ["Clothing", "/shops"],
              ] as const
            ).map(([label, href], i) => (
              <div key={label}>
                {i > 0 ? (
                  <div className="mx-4 border-t border-[#EEEEEE]" />
                ) : null}
                <RowLink
                  href={href}
                  testId={i === 0 ? "service-circle-shops" : undefined}
                  title={label}
                  icon={<ShoppingBag className="h-5 w-5" strokeWidth={2} />}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Keep Safety reachable */}
      <AppLink
        href="/safety"
        data-testid="service-circle-safety"
        className="uber-press mt-8 block text-center text-[14px] font-semibold text-[#6B6B6B] no-underline"
      >
        Safety tools
      </AppLink>
    </main>
  );
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="#111"
        strokeWidth="1.75"
      />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="#111" strokeWidth="1.75" />
    </svg>
  );
}

function PeopleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <circle cx="9" cy="8" r="3" fill="#111" />
      <circle cx="16" cy="9" r="2.5" fill="#666" />
      <path
        d="M2 19c0-3 3-5 7-5s7 2 7 5"
        fill="none"
        stroke="#111"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <circle cx="6" cy="12" r="2.5" fill="#111" />
      <circle cx="18" cy="12" r="2.5" fill="#111" />
      <path d="M8.5 12h7" stroke="#111" strokeWidth="1.75" />
    </svg>
  );
}

export default function ServicesPage() {
  return (
    <OnboardingGate>
      <ServicesContent />
    </OnboardingGate>
  );
}
