"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toPng } from "html-to-image";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";
import { getAppInstallUrl, getPamphletEntryUrl } from "@/lib/app-links";

const QR_SIZE = 280;

/**
 * Printable pamphlet — QR opens /get-app (install + home screen).
 * Download PNG for print shops or use browser Print.
 */
export function PamphletCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const entryUrl = getPamphletEntryUrl();
  const qrSrc = `/api/qr?url=${encodeURIComponent(entryUrl)}&size=${QR_SIZE}`;

  function downloadPng() {
    const node = cardRef.current;
    if (!node) return;
    setError(null);
    start(async () => {
      try {
        const ratio = Math.max(2, 1200 / Math.max(node.offsetWidth, 1));
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: ratio,
          backgroundColor: "#ffffff",
        });
        const a = document.createElement("a");
        a.download = "village-ride-pamphlet.png";
        a.href = dataUrl;
        a.click();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not generate image");
      }
    });
  }

  function printPamphlet() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        data-testid="pamphlet-card"
        className="pamphlet-print mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg"
      >
        <div className="bg-black px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">{BRAND.appName}</p>
              <p className="text-xs text-white/70">Rides &amp; deliveries</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/85">
            {BRAND_TAGLINE}
          </p>
        </div>

        <div className="px-6 py-6 text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
            Scan to open the app
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-black">
            Point your camera here
          </p>

          <div className="mt-5 flex justify-center">
            <div className="rounded-2xl border-2 border-black bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`QR code — opens ${BRAND.appName}`}
                width={QR_SIZE}
                height={QR_SIZE}
                className="h-auto w-[min(100%,280px)]"
              />
            </div>
          </div>

          <p className="mt-4 break-all text-sm font-semibold text-black">
            {getAppInstallUrl()}
          </p>

          <ol className="mt-6 space-y-2 text-left text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="font-bold text-black">1.</span>
              Scan the QR with your phone camera
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-black">2.</span>
              Tap the link — Village Ride opens in your browser
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-black">3.</span>
              Tap <strong className="text-black">Install</strong> or{" "}
              <strong className="text-black">Add to Home Screen</strong>
            </li>
          </ol>

          <p className="mt-5 text-xs text-slate-500">
            Pay cash or card · Drivers keep 90%
          </p>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Need help?</p>
          <p className="mt-0.5">
            WhatsApp {BRAND.phone} · {BRAND.company}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <button
          type="button"
          onClick={downloadPng}
          disabled={pending}
          className="ru-btn ru-btn-primary flex-1 !rounded-full"
        >
          {pending ? "Generating…" : "Download PNG for print"}
        </button>
        <button
          type="button"
          onClick={printPamphlet}
          className="ru-btn ru-btn-secondary flex-1 !rounded-full"
        >
          Print pamphlet
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-rose-700 print:hidden">{error}</p>
      ) : null}
    </div>
  );
}
