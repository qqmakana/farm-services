"use client";

import { useRef, useState, useTransition, type RefObject } from "react";
import { toPng } from "html-to-image";
import { BRAND, BRAND_ADDRESS_LINE } from "@/lib/brand";
import { getAppInstallUrl, getSocialQrEntryUrl } from "@/lib/app-links";

const QR_FEED = 168;
const QR_REEL = 156;

type Shape = "feed" | "reel";

/**
 * Short social post — 4:5 for Facebook/Instagram, 9:16 for Reels/TikTok.
 * QR sits where the big 10% used to be. Scan opens the app for anyone.
 */
export function DriverGivesBackCard() {
  const feedRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const entryUrl = getSocialQrEntryUrl();

  function download(shape: Shape) {
    const node = shape === "reel" ? reelRef.current : feedRef.current;
    if (!node) return;
    setError(null);
    start(async () => {
      try {
        const targetW = 1080;
        const ratio = Math.max(2, targetW / Math.max(node.offsetWidth, 1));
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: ratio,
          backgroundColor: "#1a2332",
        });
        const a = document.createElement("a");
        a.download =
          shape === "reel"
            ? "village-ride-scan-reel.png"
            : "village-ride-scan.png";
        a.href = dataUrl;
        a.click();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save the picture");
      }
    });
  }

  return (
    <div className="space-y-6">
      <ScanCard
        cardRef={feedRef}
        shape="feed"
        qrSize={QR_FEED}
        entryUrl={entryUrl}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => download("feed")}
          disabled={pending}
          className="ru-btn ru-btn-primary flex-1 !rounded-full"
        >
          {pending ? "Saving…" : "Save for Facebook / Instagram"}
        </button>
        <button
          type="button"
          onClick={() => download("reel")}
          disabled={pending}
          className="ru-btn ru-btn-secondary flex-1 !rounded-full"
        >
          {pending ? "Saving…" : "Save for Reels / TikTok"}
        </button>
      </div>
      {error ? (
        <p className="text-sm font-medium text-rose-700">{error}</p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Post the picture. Friends open their camera and point it at the square.
          Riders, drivers — same scan.
        </p>
      )}

      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Reels / TikTok (taller, same words)
      </p>
      <ScanCard
        cardRef={reelRef}
        shape="reel"
        qrSize={QR_REEL}
        entryUrl={entryUrl}
      />
    </div>
  );
}

function ScanCard({
  cardRef,
  shape,
  qrSize,
  entryUrl,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  shape: Shape;
  qrSize: number;
  entryUrl: string;
}) {
  const qrSrc = `/api/qr?url=${encodeURIComponent(entryUrl)}&size=${qrSize * 2}`;
  const isReel = shape === "reel";

  return (
    <div
      ref={cardRef}
      data-testid={isReel ? "scan-card-reel" : "scan-card-feed"}
      className={`mx-auto w-full overflow-hidden rounded-2xl text-white shadow-xl ${
        isReel ? "max-w-[280px] aspect-[9/16]" : "max-w-[360px] aspect-[4/5]"
      }`}
      style={{
        backgroundColor: "#1a2332",
        backgroundImage:
          "radial-gradient(ellipse at 50% 18%, #2a3548 0%, #1a2332 58%)",
      }}
    >
      <div
        className={`flex h-full flex-col items-center text-center ${
          isReel ? "justify-center px-6 py-8" : "justify-between px-5 py-5"
        }`}
      >
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-400/90 uppercase">
            {BRAND.appName}
          </p>
          <h1
            className={`mt-2 font-bold tracking-tight text-white ${
              isReel ? "text-[1.45rem] leading-tight" : "text-[1.35rem] leading-snug"
            }`}
          >
            Need a lift?
            <br />
            <span className="text-amber-400">Just scan this.</span>
          </h1>
          <p
            className={`mx-auto max-w-[18rem] text-slate-300 ${
              isReel ? "mt-3 text-[13px] leading-relaxed" : "mt-2 text-xs leading-relaxed"
            }`}
          >
            Small team in Westdene. Still new. If you need a ride, a delivery,
            or you drive — this little square is for you.
          </p>
        </div>

        <div className={isReel ? "mt-6" : "mt-3"}>
          <div className="mx-auto w-fit rounded-2xl bg-white p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="Scan to open Village Ride"
              width={qrSize}
              height={qrSize}
              className="block"
              style={{ width: qrSize, height: qrSize }}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-400">
            Camera on the square · then Add to Home Screen
          </p>
        </div>

        <div className={isReel ? "mt-6" : "mt-2"}>
          <p className="text-[11px] text-slate-400">
            We only take 10%. You keep the rest.
          </p>
          <p className="mt-2 text-[11px] leading-snug font-medium text-slate-200">
            {BRAND_ADDRESS_LINE}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {BRAND.company}
          </p>
          <p className="mt-1 break-all text-[10px] font-medium text-amber-400/90">
            {getAppInstallUrl()}
          </p>
        </div>
      </div>
    </div>
  );
}
