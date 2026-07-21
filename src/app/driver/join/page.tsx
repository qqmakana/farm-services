"use client";

import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { DriverApplyForm } from "@/components/driver-apply-form";
import { BRAND } from "@/lib/brand";
import { WhatsAppLinks } from "@/lib/whatsapp-links";

export default function DriverJoinPage() {
  return (
    <>
      <SiteNav active="driver" />
      <main className="mx-auto max-w-lg px-4 py-10 pb-20">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Drive with {BRAND.appName}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">
          Earn money with your vehicle
        </h1>
        <p className="mt-3 text-base text-slate-700">
          Keep <strong>85%</strong> of every trip. Upload your photo and vehicle
          photo (plate visible) so customers know who and what to expect.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>✓ Your photo + bakkie/car shown on every trip</li>
          <li>✓ Verified partner deliveries + rides</li>
          <li>✓ Go online when you want</li>
        </ul>
        <div className="mt-6">
          <DriverApplyForm compactTitle="Apply now — photos required" />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Already applied?{" "}
          <Link href="/driver" className="font-semibold text-[#1A4D3A]">
            Open driver app
          </Link>
        </p>
        <a
          href={WhatsAppLinks.chatUs()}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white"
        >
          Chat with us on WhatsApp
        </a>
      </main>
    </>
  );
}
