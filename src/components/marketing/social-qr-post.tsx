"use client";

import { SHARE_IMAGE_PATH } from "@/lib/share-qr";

/**
 * QR-free 1:1 post for Instagram, Facebook and WhatsApp status.
 * QR codes remain on printed pamphlets, where a second phone is not needed.
 */
export function SocialQrPost() {
  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SHARE_IMAGE_PATH}
        alt="Village Ride serves villages, towns and cities and humbly welcomes more drivers"
        width={1024}
        height={1024}
        data-testid="social-qr-post"
        className="mx-auto aspect-square w-full max-w-[420px] rounded-2xl shadow-lg ring-1 ring-slate-200"
      />

      <a
        href={SHARE_IMAGE_PATH}
        download="village-ride-social.png"
        className="ru-btn ru-btn-primary w-full !rounded-full"
      >
        Download square PNG for social
      </a>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">For social media</p>
        <p className="mt-2 text-xs leading-relaxed sm:text-sm">
          Post the picture together with the clickable Village Ride link.
          There is no QR code because most people will view it on the same
          phone they would otherwise need for scanning.
        </p>
      </div>
    </div>
  );
}
