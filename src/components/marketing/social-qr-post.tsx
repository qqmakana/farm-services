"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toPng } from "html-to-image";
import { BRAND } from "@/lib/brand";
import { getSiteHost, getSocialQrEntryUrl } from "@/lib/app-links";

const QR_SIZE = 340;

/**
 * Square 1:1 post for Instagram, Facebook, WhatsApp status.
 * Big QR — viewers scan with their phone camera (not by tapping the post).
 */
export function SocialQrPost() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const entryUrl = getSocialQrEntryUrl();
  const qrSrc = `/api/qr?url=${encodeURIComponent(entryUrl)}&size=${QR_SIZE}`;

  function downloadPng() {
    const node = cardRef.current;
    if (!node) return;
    setError(null);
    start(async () => {
      try {
        const ratio = Math.max(2, 1080 / Math.max(node.offsetWidth, 1));
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: ratio,
          backgroundColor: "#ffffff",
        });
        const a = document.createElement("a");
        a.download = "village-ride-social-qr.png";
        a.href = dataUrl;
        a.click();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not generate image");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        data-testid="social-qr-post"
        className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-lg ring-1 ring-slate-200"
      >
        <div className="flex h-full flex-col items-center justify-between px-[8%] py-[9%] text-center">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full"
            />
            <p className="text-[clamp(1rem,4vw,1.35rem)] font-bold tracking-tight text-black">
              {BRAND.appName}
            </p>
          </div>

          <div>
            <p className="text-[clamp(0.65rem,2.5vw,0.85rem)] font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Scan with your camera
            </p>
            <p className="mt-1 text-[clamp(1.1rem,4.5vw,1.5rem)] font-bold leading-tight text-black">
              Open the app
            </p>
            <div className="mt-4 flex justify-center">
              <div className="rounded-2xl border-[3px] border-black bg-white p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt={`Scan to open ${BRAND.appName}`}
                  width={QR_SIZE}
                  height={QR_SIZE}
                  className="h-auto w-[min(72vw,340px)] max-w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[clamp(0.75rem,2.8vw,0.95rem)] font-semibold text-black">
              {getSiteHost()}/get-app
            </p>
            <p className="mt-1 text-[clamp(0.65rem,2.4vw,0.8rem)] text-slate-500">
              Rides &amp; deliveries · Pay cash or card
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={downloadPng}
        disabled={pending}
        className="ru-btn ru-btn-primary w-full !rounded-full"
      >
        {pending ? "Generating…" : "Download square PNG for social"}
      </button>

      {error ? (
        <p className="text-sm font-medium text-rose-700">{error}</p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">How scanning from social works</p>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-relaxed sm:text-sm">
          <li>
            Post this image on Instagram, Facebook, or WhatsApp — no link
            required in the caption.
          </li>
          <li>
            Viewers open their <strong>phone Camera</strong> app and point it
            at the QR on their screen (or a friend&apos;s phone).
          </li>
          <li>
            They tap the link banner that appears → install page opens → Add to
            Home Screen.
          </li>
          <li>
            On iPhone: screenshot the post, open Photos, tap the QR hint if it
            appears. On some Android phones: long-press the image.
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Tip: a link in the first comment still helps people who cannot scan
          from the same phone.
        </p>
      </div>
    </div>
  );
}
