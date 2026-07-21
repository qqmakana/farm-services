"use client";

import Link from "next/link";
import { Car, Tractor, Truck } from "lucide-react";
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
] as const;

export default function DriverJoinPage() {
  return (
    <>
      <SiteNav active="driver" />
      {/* Force light surface — recruitment page must stay readable in dark mode */}
      <main className="min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Drive with {BRAND.appName}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-900">
            Earn with your car, bakkie, or truck
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            Keep <strong className="text-slate-900">85%</strong> of every job.
            Village Ride needs drivers for{" "}
            <strong className="text-slate-900">all three services</strong> —
            not rides only.
          </p>

          <ul className="mt-5 space-y-3">
            {SERVICES.map(({ Icon, title, blurb }) => (
              <li
                key={title}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-[#fafafa] p-3.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A4D3A] text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-600">
                    {blurb}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <ul className="mt-5 space-y-2 text-sm text-slate-700">
            <li>✓ Photo of you + vehicle (plate visible) on every job</li>
            <li>✓ Apply once — get offered rides, deliveries &amp; farm jobs</li>
            <li>✓ Flexible hours · go online when you want</li>
          </ul>

          <div className="mt-6 [&_.ru-card]:border-slate-200 [&_.ru-card]:bg-white [&_.ru-card]:text-slate-900 [&_.ru-input]:border-slate-200 [&_.ru-input]:bg-[#F9FAFB] [&_.ru-input]:text-slate-900">
            <DriverApplyForm compactTitle="Apply now — photos required" />
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Already applied?{" "}
            <Link
              href="/driver"
              className="font-semibold text-[#1A4D3A] underline"
            >
              Open driver app
            </Link>
          </p>
          <a
            href={WhatsAppLinks.chatUs()}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white"
          >
            Chat with us on WhatsApp
          </a>
        </div>
      </main>
    </>
  );
}
