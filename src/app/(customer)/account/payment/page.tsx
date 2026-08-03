"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { paymentHint, paymentLabel } from "@/lib/countries";

export default function PaymentMethodsPage() {
  const { country } = useCountry();

  return (
    <main className="ru-page ru-force-light">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm font-semibold text-black transition active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="ru-page-title mt-4">Payment methods</h1>
      <p className="ru-page-sub">
        At checkout you choose Cash or Card (PayPal) for every booking in{" "}
        {country.flag} {country.name}.
      </p>

      <ul className="mt-6 space-y-3">
        <li className="ru-card p-4">
          <p className="text-sm font-bold text-black">Pay cash</p>
          <p className="mt-1 text-xs text-[var(--ru-muted)]">
            Pay the driver directly. Village Ride takes ~15% from the driver’s
            prepaid wallet after the trip.
          </p>
        </li>
        <li className="ru-card p-4">
          <p className="text-sm font-bold text-black">Pay card (PayPal)</p>
          <p className="mt-1 text-xs text-[var(--ru-muted)]">
            Pay the full fare online. The driver is credited ~85% when the trip
            completes. Requires PayPal keys in production.
          </p>
        </li>
      </ul>

      <h2 className="mt-8 text-sm font-bold text-black">
        Also listed for {country.name}
      </h2>
      <ul className="mt-3 space-y-3">
        {country.payments.map((method) => (
          <li key={method} className="ru-card p-4">
            <p className="text-sm font-semibold text-black">
              {paymentLabel(method)}
            </p>
            <p className="mt-1 text-xs text-[var(--ru-muted)]">
              {paymentHint(method)}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
