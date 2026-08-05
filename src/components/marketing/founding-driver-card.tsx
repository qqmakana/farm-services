"use client";

import { useRef, useState, useEffect, useTransition } from "react";
import { toPng } from "html-to-image";
import {
  FOUNDING_APP_URL,
  FOUNDING_CITIES,
  FOUNDING_ERA_CUTOFF_ISO,
  daysLeftInFoundingEra,
} from "@/lib/founding-driver";
import { BRAND } from "@/lib/brand";

/**
 * Square social creative — Founding Driver Bonus Pool.
 * Downloads as 1080×1080 PNG for Instagram / Facebook / WhatsApp.
 */
export function FoundingDriverCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDaysLeft(daysLeftInFoundingEra());
    const t = setInterval(() => setDaysLeft(daysLeftInFoundingEra()), 60_000);
    return () => clearInterval(t);
  }, []);

  const cutoffLabel = new Date(FOUNDING_ERA_CUTOFF_ISO).toLocaleDateString(
    "en-ZA",
    { day: "numeric", month: "short", year: "numeric" },
  );

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
          backgroundColor: "#0a0a0a",
        });
        const a = document.createElement("a");
        a.download = "village-ride-founding-driver.png";
        a.href = dataUrl;
        a.click();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not generate image",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        data-testid="founding-driver-card"
        className="relative aspect-square w-full overflow-hidden rounded-2xl text-white shadow-lg"
        style={{
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(ellipse at 20% 0%, #3d2a0a 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, #1a1208 0%, #0a0a0a 50%)",
        }}
      >
        <div className="flex h-full flex-col px-[7%] pt-[7%] pb-0">
          <p className="text-[clamp(0.7rem,2.4vw,1.15rem)] font-semibold tracking-[0.2em] text-amber-400/90 uppercase">
            {BRAND.appName}
          </p>
          <h1 className="mt-[4%] text-[clamp(1.6rem,6.2vw,3.4rem)] leading-[1.05] font-bold tracking-tight text-white">
            Founding Driver
            <br />
            Bonus Pool
          </h1>
          <p className="mt-[3%] max-w-[92%] text-[clamp(0.75rem,2.8vw,1.35rem)] leading-snug text-gray-200">
            Complete your first trip before {cutoffLabel} and lock in a monthly
            city bonus reward.
          </p>

          <div className="mt-[5%] inline-flex max-w-fit items-baseline gap-2 rounded-2xl bg-amber-500 px-[4%] py-[2.5%] text-black">
            <span className="text-[clamp(1.6rem,6vw,3rem)] font-bold tabular-nums">
              {daysLeft}
            </span>
            <span className="text-[clamp(0.7rem,2.4vw,1.15rem)] font-semibold">
              days left in Founding Era
            </span>
          </div>

          <div className="mt-[5%]">
            <p className="text-[clamp(0.65rem,2vw,0.95rem)] font-semibold tracking-wide text-amber-400/90 uppercase">
              Cities
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[clamp(0.8rem,2.8vw,1.35rem)] font-semibold text-white">
              {FOUNDING_CITIES.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-auto pt-4 text-center text-[clamp(0.95rem,3.4vw,1.75rem)] font-bold tracking-tight text-white">
            {FOUNDING_APP_URL}
          </p>

          {/* Footer — white text on dark for social readability */}
          <div className="mt-3 -mx-[7.6%] border-t border-white/20 bg-black/75 px-[7%] py-3 backdrop-blur-sm">
            <p className="text-center text-[clamp(0.7rem,2.4vw,1.1rem)] font-medium text-gray-100">
              Village Ride from Sandton Streets
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={download}
        disabled={pending}
        className="uber-press uber-btn-black flex w-full items-center justify-center gap-2 !min-h-14 !text-base"
      >
        {pending ? "Preparing…" : "Download & Share"}
      </button>
      {error ? (
        <p className="text-center text-sm text-rose-600">{error}</p>
      ) : (
        <p className="text-center text-xs text-gray-500">
          Saves as village-ride-founding-driver.png (≈1080×1080)
        </p>
      )}
    </div>
  );
}
