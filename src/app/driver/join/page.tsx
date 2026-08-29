"use client";

import Link from "next/link";
import { Car, Package, Tractor, Truck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { DriverApplyForm } from "@/components/driver-apply-form";
import { BRAND } from "@/lib/brand";
import { OPERATING_LAUNCH } from "@/lib/launch";
import { WhatsAppLinks } from "@/lib/whatsapp-links";

const SERVICES = [
  {
    Icon: Car,
    title: "Trip",
    blurb: "Rides — plus one stop, Reserve, Solo / 2 / 4",
  },
  {
    Icon: Truck,
    title: "Fetch",
    blurb: "Collect or buy and bring it to the rider — shops, farm, clinic",
  },
  {
    Icon: Package,
    title: "Send",
    blurb: "Parcel to someone else — documents or a small package",
  },
  {
    Icon: Tractor,
    title: "Shops",
    blurb: "Rider pays for goods at the shop. You earn the Fetch fee.",
  },
] as const;

export default function DriverJoinPage() {
  return (
    <>
      <SiteNav active="driver" />
      <main className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] text-[var(--ru-ink)]">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <header className="rounded-2xl bg-black px-5 py-7 text-white">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#f0c14b] uppercase">
              {OPERATING_LAUNCH.headline}
            </p>
            <h1 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight">
              Drive with {BRAND.appName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {OPERATING_LAUNCH.driver} South Africa applicants need a 13-digit
              SA ID — no passports.
            </p>
          </header>

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

          <ul className="mt-5 space-y-2.5 px-1 text-sm font-medium text-[var(--ru-ink)]">
            <li className="flex gap-2">
              <span className="text-[var(--ru-muted)]" aria-hidden>
                ·
              </span>
              Keep 90% · pay is cash or card to you
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--ru-muted)]" aria-hidden>
                ·
              </span>
              Apply now — paid jobs start at the end of September
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--ru-muted)]" aria-hidden>
                ·
              </span>
              Your photo and vehicle on every job
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--ru-muted)]" aria-hidden>
                ·
              </span>
              South Africa: 13-digit SA ID only — no passports
            </li>
          </ul>

          <div className="ru-card mt-6 p-5" id="apply">
            <DriverApplyForm compactTitle="Apply to drive" />
          </div>

          <p className="mt-4 text-center text-xs text-[var(--ru-muted)]">
            Already a driver?{" "}
            <Link href="/driver" className="font-semibold text-black underline">
              Open driver app
            </Link>
          </p>
          <a
            href={WhatsAppLinks.chatUs()}
            className="ru-btn ru-btn-block mt-4 !bg-[#25D366] !text-white hover:!bg-[#1ebe57]"
          >
            Questions? Chat on WhatsApp
          </a>
        </div>
      </main>
    </>
  );
}
