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
    <div className="ru-card mt-6 border border-[var(--ru-line)] bg-white p-5 shadow-[var(--ru-shadow)]">
      <p className="font-[family-name:var(--font-display)] text-lg font-bold text-black">
        Turn your bakkie into income
      </p>
      <p className="mt-1 text-sm text-[var(--ru-muted)]">
        Keep ~85% of every trip. Flexible hours. Free to join.
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
