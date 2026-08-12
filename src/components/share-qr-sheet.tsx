"use client";

import { BRAND, BRAND_ADDRESS_LINE } from "@/lib/brand";
import { socialQrImagePath } from "@/lib/share-qr";

/** Show a friend the scan square — no need to send a link. */
export function ShareQrSheet({
  onClose,
  onShare,
}: {
  onClose: () => void;
  onShare: () => void;
}) {
  const src = socialQrImagePath(280);

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
        <p className="text-lg font-bold tracking-tight">Show this to a friend</p>
        <p className="mt-1 text-sm text-slate-600">
          They open their camera and point it here. Rides, deliveries, or
          driving — same square.
        </p>
        <div className="mt-4 flex justify-center">
          <div className="rounded-2xl border-2 border-black bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Scan to open ${BRAND.appName}`}
              width={200}
              height={200}
              className="h-[200px] w-[200px]"
            />
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          {BRAND_ADDRESS_LINE}
        </p>
        <button
          type="button"
          onClick={onShare}
          className="mt-4 w-full rounded-full bg-black py-3 text-sm font-bold text-white"
        >
          Send the square
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
