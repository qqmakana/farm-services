"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { AdCar } from "@/components/marketing/ad-car";
import { DriverGivesBackCard } from "@/components/marketing/driver-gives-back-card";
import {
  DRIVER_AD_CAPTION,
  DRIVER_AD_IMAGE,
  DRIVER_AD_WHATSAPP,
} from "@/lib/marketing/driver-ad-copy";

export default function MarketingAdsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <SiteNav />
      <main className="ru-force-light min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Pictures to post
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#000000]">
            Scan square
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Short pictures for Facebook, Instagram, Reels and TikTok. Anyone
            can scan — riders and drivers. Same square opens the app.
          </p>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-black">Need a lift? Just scan this.</h2>
            <p className="mt-1 text-sm text-slate-600">
              The square sits in the middle. Address is on the picture so people
              know we&apos;re a real place in Westdene.
            </p>
            <div className="mt-4">
              <DriverGivesBackCard />
            </div>
          </section>

          <section className="mt-10 border-t border-slate-200 pt-8">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Classic square ad
            </p>
            <div className="mt-4">
              <AdCar />
            </div>
          </section>

          <a
            href={DRIVER_AD_IMAGE}
            download="village-ride-driver-ad.png"
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#000000] py-3.5 text-sm font-bold text-white"
          >
            Download PNG
          </a>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Caption</p>
                <button
                  type="button"
                  onClick={() => copy(DRIVER_AD_CAPTION, "cap")}
                  className="text-sm font-bold text-[#000000]"
                >
                  {copied === "cap" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                {DRIVER_AD_CAPTION}
              </pre>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">WhatsApp</p>
                <button
                  type="button"
                  onClick={() => copy(DRIVER_AD_WHATSAPP, "wa")}
                  className="text-sm font-bold text-[#000000]"
                >
                  {copied === "wa" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                {DRIVER_AD_WHATSAPP}
              </pre>
            </div>
          </div>

          <p className="mt-8 text-center text-sm">
            Boost link:{" "}
            <Link
              href="/driver/join"
              className="font-semibold text-[#000000] underline"
            >
              /driver/join
            </Link>
            {" · "}
            <Link
              href="/marketing/founding-driver"
              className="font-semibold text-[#000000] underline"
            >
              Founding Driver card
            </Link>
            {" · "}
            <Link
              href="/marketing/pamphlet"
              className="font-semibold text-[#000000] underline"
            >
              Pamphlet QR
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
