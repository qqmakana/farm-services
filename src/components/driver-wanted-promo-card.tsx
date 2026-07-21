"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSelectedDriverId } from "@/lib/driver-session";

/** Services page — bakkie / income promo. */
export function DriverWantedPromoCard() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!getSelectedDriverId());
  }, []);

  if (!show) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
        Drive for all three services
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Village Ride · Village Delivery · Farm Connect — keep ~85%, flexible
        hours, free to join.
      </p>
      <Link
        href="/driver/join"
        className="ru-btn ru-btn-brand mt-4 !min-h-11 !px-5 !text-sm"
      >
        Join as a driver
      </Link>
    </div>
  );
}
