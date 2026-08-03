"use client";

import Link from "next/link";
import { Car, Package, Tractor, Truck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { DriverApplyForm } from "@/components/driver-apply-form";
import { BRAND } from "@/lib/brand";
import { WhatsAppLinks } from "@/lib/whatsapp-links";

const SERVICES = [
  {
    Icon: Car,
    title: "Village Ride",
    blurb: "Passenger trips — village ↔ town, night rides, group rides",
  },
  {
    Icon: Truck,
    title: "Village Delivery",
    blurb: "Shop & merchant deliveries — parcels, furniture, appliances",
  },
  {
    Icon: Tractor,
    title: "Farm Connect",
    blurb: "Farm logistics — produce, livestock crates, equipment",
  },
  {
    Icon: Package,
    title: "Courier",
    blurb: "Person-to-person packages — keys, gifts, documents",
  },
] as const;

export default function DriverJoinPage() {
  return (
    <>
      <SiteNav active="driver" />
      <main className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] text-[var(--ru-ink)]">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <p className="ru-section-label">Drive with {BRAND.appName}</p>
          <h1 className="ru-page-title mt-2 !text-[1.85rem]">
            Earn with your car, bakkie, or truck
          </h1>
          <p className="ru-page-sub">
            Keep <strong className="text-[var(--ru-ink)]">85%</strong> of every
            job. Drivers for all four services — not rides only.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {SERVICES.map(({ Icon, title, blurb }) => (
              <div key={title} className="ru-card flex flex-col items-start p-4">
                <span className="ru-icon-circle">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-bold text-[var(--ru-ink)]">
                  {title}
                </p>
                <p className="mt-1 text-xs leading-snug text-[var(--ru-muted)]">
                  {blurb}
                </p>
              </div>
            ))}
          </div>

          <ul className="ru-card mt-5 space-y-2 p-4 text-sm font-medium text-[var(--ru-ink)]">
            <li>✓ 85% earnings · cash to you</li>
            <li>✓ Browse jobs right away — verify before your first paid trip</li>
            <li>✓ Photo of you + vehicle on every job</li>
          </ul>

          <div className="ru-card mt-6 p-5">
            <DriverApplyForm compactTitle="Apply now — photos required" />
          </div>

          <p className="mt-4 text-center text-xs text-[var(--ru-muted)]">
            Already applied?{" "}
            <Link href="/driver" className="font-semibold text-black underline">
              Open driver app
            </Link>
          </p>
          <a
            href={WhatsAppLinks.chatUs()}
            className="ru-btn ru-btn-block mt-4 !bg-[#25D366] !text-white hover:!bg-[#1ebe57]"
          >
            Chat with us on WhatsApp
          </a>
        </div>
      </main>
    </>
  );
}
