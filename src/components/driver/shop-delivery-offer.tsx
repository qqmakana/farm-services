"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/format";
import { shopDeliveryOfferLines } from "@/lib/shop-delivery";
import type { Job } from "@/lib/types";

export function ShopDeliveryOffer({
  job,
  pending,
  onAccept,
  onDecline,
}: {
  job: Job;
  pending: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const lines = shopDeliveryOfferLines(job);
  const [left, setLeft] = useState(() => remaining(job.offer_expires_at));
  const expired = useRef(false);

  useEffect(() => {
    expired.current = false;
    setLeft(remaining(job.offer_expires_at));
    const t = window.setInterval(() => {
      const next = remaining(job.offer_expires_at);
      setLeft(next);
      if (next === 0 && !expired.current) {
        expired.current = true;
        onDecline();
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [job.offer_expires_at, job.id, onDecline]);

  return (
    <div
      data-testid="shop-delivery-offer"
      className="absolute inset-0 z-[700] flex flex-col bg-[#0E0E0E] px-5 pb-8 pt-10 text-white"
    >
      <p className="text-center text-[13px] font-bold tracking-[0.18em] text-[#06c167]">
        📦 NEW DELIVERY
      </p>
      <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#06c167] text-3xl font-black tabular-nums text-white">
        {left ?? 15}
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-white/70">
        seconds to accept
      </p>

      <div className="mt-8 space-y-4 rounded-[20px] bg-[#1C1C1C] p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/45">
            Collect from
          </p>
          <p className="mt-0.5 text-[18px] font-bold leading-snug">
            {lines.shop}
          </p>
          <p className="mt-1 text-[14px] text-white/75">{lines.pickup}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/45">
            Deliver to
          </p>
          <p className="mt-0.5 text-[16px] font-semibold leading-snug">
            {lines.dropoff}
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <p className="text-[15px] font-medium text-white/80">
            Items: {lines.items || "packed bag"}
          </p>
          <p className="text-[22px] font-black text-[#06c167]">
            You earn {formatMoney(lines.earn)}
          </p>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
        <button
          type="button"
          disabled={pending}
          onClick={onDecline}
          className="uber-press min-h-14 rounded-full bg-[#3D3D3D] text-[17px] font-bold text-white"
        >
          DECLINE
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onAccept}
          className="uber-press min-h-14 rounded-full bg-[#05944F] text-[17px] font-bold text-white"
        >
          ACCEPT
        </button>
      </div>
    </div>
  );
}

function remaining(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 15;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return 15;
  return Math.max(0, Math.ceil(ms / 1000));
}
