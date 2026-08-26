"use client";

import { BRAND } from "@/lib/brand";
import { getAppInstallUrl } from "@/lib/app-links";
import { SHARE_IMAGE_PATH } from "@/lib/share-qr";

/** Preview the QR-free artwork attached by the native Share action. */
export function ShareQrSheet({
  onClose,
  onShare,
}: {
  onClose: () => void;
  onShare: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
        <p className="text-lg font-bold tracking-tight">Share Village Ride</p>
        <p className="mt-1 text-sm text-slate-600">
          Send this picture and link. Anyone can install Village Ride on their
          home screen — they do not need a Google Play tester invite.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SHARE_IMAGE_PATH}
          alt={`${BRAND.appName} serves villages, towns and cities, and humbly welcomes more drivers`}
          width={1024}
          height={1024}
          className="mt-4 aspect-square w-full rounded-2xl object-cover"
        />
        <p className="mt-1 break-all text-center text-xs font-medium text-black">
          {getAppInstallUrl()}
        </p>
        <button
          type="button"
          onClick={onShare}
          className="mt-4 w-full rounded-full bg-black py-3 text-sm font-bold text-white"
        >
          Share picture and link
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-full py-3 text-sm font-semibold text-slate-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
