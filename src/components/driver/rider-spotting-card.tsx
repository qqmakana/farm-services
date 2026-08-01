"use client";

import { User } from "lucide-react";
import {
  riderPhotoFromDetails,
  wearingFromDetails,
} from "@/lib/rider-photo";

type Props = {
  customerName: string;
  details: unknown;
  /** Optional rating if available. */
  ratingAvg?: number | null;
  className?: string;
};

/**
 * Driver-facing rider face + wearing — large enough to spot at pickup.
 */
export function RiderSpottingCard({
  customerName,
  details,
  ratingAvg,
  className = "",
}: Props) {
  const photo = riderPhotoFromDetails(details);
  const wearing = wearingFromDetails(details);
  if (!photo && !wearing) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-[var(--ru-line)] bg-[#fafafa] p-3 ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={customerName || "Rider"}
          className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-black/10"
        />
      ) : (
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
          {(customerName || "?").charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-black">
          {customerName || "Rider"}
        </p>
        {typeof ratingAvg === "number" && ratingAvg > 0 ? (
          <p className="text-xs text-[var(--ru-muted)]">
            ★ {ratingAvg.toFixed(1)}
          </p>
        ) : null}
        {wearing ? (
          <p className="mt-1 text-sm text-black">
            <span className="text-[var(--ru-muted)]">Wearing: </span>
            <span className="font-semibold">{wearing}</span>
          </p>
        ) : photo ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ru-muted)]">
            <User className="h-3.5 w-3.5" aria-hidden />
            Rider photo for pickup
          </p>
        ) : null}
      </div>
    </div>
  );
}
