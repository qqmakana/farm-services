"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { PaymentBadge } from "@/components/marketing/payment-badge";
import { AdCar } from "@/components/marketing/ad-car";
import {
  DRIVER_AD_CAPTION,
  DRIVER_AD_WHATSAPP,
  DRIVER_ADS,
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
      <main className="min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Driver recruitment
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A4D3A]">
            Social ads — Cash &amp; Card
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Download creatives, copy captions, boost with destination{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">
              /driver/join
            </code>
            .
          </p>

          <div className="mt-4">
            <PaymentBadge methods={["cash", "card"]} />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold">Preview (square)</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <AdCar variant="village" showBadge={false} />
              <AdCar variant="white" showBadge={false} />
              <AdCar variant="gradient" showBadge={false} />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold">Download</h2>
            <ul className="mt-3 space-y-4">
              {DRIVER_ADS.map((ad) => (
                <li
                  key={ad.id}
                  className="rounded-2xl border border-slate-200 bg-[#fafafa] p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative mx-auto w-full max-w-[200px] shrink-0 overflow-hidden rounded-xl bg-white sm:mx-0">
                      <Image
                        src={ad.src}
                        alt={ad.title}
                        width={400}
                        height={ad.id === "story" ? 711 : ad.id === "landscape" ? 210 : 400}
                        className="h-auto w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{ad.title}</p>
                      <p className="text-xs text-slate-500">{ad.size}</p>
                      <a
                        href={ad.src}
                        download
                        className="mt-3 inline-flex rounded-xl bg-[#1A4D3A] px-4 py-2.5 text-sm font-bold text-white"
                      >
                        Download PNG
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-bold">Captions</h2>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Instagram / Facebook</p>
                <button
                  type="button"
                  onClick={() => copy(DRIVER_AD_CAPTION, "cap")}
                  className="text-sm font-bold text-[#1A4D3A]"
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
                <p className="text-sm font-semibold">WhatsApp status</p>
                <button
                  type="button"
                  onClick={() => copy(DRIVER_AD_WHATSAPP, "wa")}
                  className="text-sm font-bold text-[#1A4D3A]"
                >
                  {copied === "wa" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                {DRIVER_AD_WHATSAPP}
              </pre>
            </div>
          </section>

          <p className="mt-8 text-center text-sm">
            <Link href="/driver/join" className="font-semibold text-[#1A4D3A] underline">
              Open driver apply page
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
