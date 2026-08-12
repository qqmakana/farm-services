"use client";

import { useRef, useState, useTransition } from "react";
import { toPng } from "html-to-image";
import { BRAND, BRAND_FULL } from "@/lib/brand";
import { FOUNDING_ERA_CUTOFF_ISO } from "@/lib/founding-driver";
import { getDriverSocialQrUrl, getSiteHost } from "@/lib/app-links";

const QR_SIZE = 120;

/**
 * Driver recruitment story/post — matches “platform that gives back” creative.
 * Includes scannable QR → /driver/join (apply to drive).
 */
export function DriverGivesBackCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cutoffLabel = new Date(FOUNDING_ERA_CUTOFF_ISO).toLocaleDateString(
    "en-ZA",
    { month: "long", year: "numeric" },
  );
  const entryUrl = getDriverSocialQrUrl();
  const qrSrc = `/api/qr?url=${encodeURIComponent(entryUrl)}&size=${QR_SIZE * 2}`;

  function download() {
    const node = cardRef.current;
    if (!node) return;
    setError(null);
    start(async () => {
      try {
        const ratio = Math.max(2, 1080 / Math.max(node.offsetWidth, 1));
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: ratio,
          backgroundColor: "#1a2332",
        });
        const a = document.createElement("a");
        a.download = "village-ride-driver-social-qr.png";
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
        data-testid="driver-gives-back-card"
        className="mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl text-white shadow-xl"
        style={{
          backgroundColor: "#1a2332",
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, #2a3548 0%, #1a2332 55%)",
        }}
      >
        <div className="px-6 pb-6 pt-7">
          <p className="text-center text-[10px] font-semibold tracking-[0.18em] text-amber-400/95 uppercase">
            {BRAND.appName} — {BRAND.company.toUpperCase()}
          </p>

          <h1 className="mt-5 text-center text-[1.65rem] font-bold leading-tight tracking-tight">
            <span className="text-white">Drive for a platform</span>
            <br />
            <span className="text-amber-400">that gives back.</span>
          </h1>

          <p className="mt-4 text-center text-sm leading-relaxed text-slate-300">
            We are a small team from Johannesburg trying something different. We
            believe drivers deserve more than just a fare.
          </p>

          <div className="mt-6 rounded-2xl bg-[#252f42] px-5 py-5 text-center">
            <p className="text-xs text-slate-400">We take from every trip</p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-emerald-400">
              10%
            </p>
            <p className="mt-1 text-xs text-slate-400">You keep the other 90%</p>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-600/70 bg-[#1f2838]/80 px-4 py-4">
            <p className="text-[11px] font-bold tracking-wide text-amber-400 uppercase">
              Founding Driver Bonus
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              If you join before{" "}
              <strong className="text-amber-300">{cutoffLabel}</strong>, you
              also get a share of{" "}
              <strong className="text-amber-300">2% of monthly revenue</strong>{" "}
              from your city. This is our way of saying thank you for trusting
              us early.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/5 px-4 py-3">
            <div className="shrink-0 rounded-xl bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="Scan to apply to drive"
                width={QR_SIZE}
                height={QR_SIZE}
                className="h-[120px] w-[120px]"
              />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-bold text-white">Scan to apply</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-400">
                Open your camera · point at the QR · tap the link
              </p>
              <p className="mt-2 truncate text-[11px] font-medium text-amber-400/90">
                {getSiteHost()}/driver/join
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-slate-500">
            {BRAND_FULL}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={download}
        disabled={pending}
        className="ru-btn ru-btn-primary w-full !rounded-full"
      >
        {pending ? "Generating…" : "Download for Instagram / WhatsApp"}
      </button>

      {error ? (
        <p className="text-sm font-medium text-rose-700">{error}</p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Post this image as-is — drivers scan the QR to apply. No link in the
          caption needed.
        </p>
      )}
    </div>
  );
}
