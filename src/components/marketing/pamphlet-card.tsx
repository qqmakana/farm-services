"use client";

import Image from "next/image";
import { BRAND, BRAND_ADDRESS_LINE } from "@/lib/brand";
import { getAppInstallUrl, getPamphletEntryUrl } from "@/lib/app-links";

const QR_SIZE = 220;

/**
 * Handout picture — screenshot and send. QR opens the app for riders and drivers.
 */
export function PamphletCard() {
  const entryUrl = getPamphletEntryUrl();
  const qrSrc = `/api/qr?url=${encodeURIComponent(entryUrl)}&size=${QR_SIZE * 2}`;

  return (
    <div
      data-testid="pamphlet-card"
      className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg"
    >
      <div className="bg-black px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full"
            />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight">{BRAND.appName}</p>
            <p className="text-[11px] text-white/70">{BRAND.company}</p>
          </div>
        </div>
        <h1 className="mt-4 text-[1.35rem] font-bold leading-tight tracking-tight">
          We could use a few more drivers.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          If you just need a ride, you&apos;re welcome too. Same square.
        </p>
      </div>

      <div className="px-5 py-5 text-center">
        <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
          Point your camera here
        </p>

        <div className="mt-3 flex justify-center">
          <div className="rounded-2xl border-2 border-black bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`Scan to open ${BRAND.appName}`}
              width={QR_SIZE}
              height={QR_SIZE}
              className="h-auto w-[min(100%,220px)]"
            />
          </div>
        </div>

        <p className="mt-3 text-sm leading-snug text-slate-700">
          Riders and drivers can both scan this. It opens the app — then Add to
          Home Screen if you&apos;d like it on your phone.
        </p>

        <p className="mt-4 text-sm text-slate-800">
          We only take <strong className="text-black">10%</strong> from the
          driver. You keep the rest.
        </p>

        <p className="mt-3 break-all text-xs font-semibold text-black">
          {getAppInstallUrl()}
        </p>

        <p className="mt-3 text-[11px] leading-snug text-slate-500">
          {BRAND_ADDRESS_LINE}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          WhatsApp {BRAND.phone}
        </p>
      </div>
    </div>
  );
}
