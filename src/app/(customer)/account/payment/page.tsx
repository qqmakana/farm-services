"use client";

import Link from "next/link";
import { ArrowLeft, Banknote, CreditCard } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { paymentHint, paymentLabel } from "@/lib/countries";

export default function PaymentMethodsPage() {
  const { country } = useCountry();

  return (
    <main className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6">
      <Link
        href="/account"
        className="uber-press inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-200"
      >
        <ArrowLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-black">
        Payment
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Cash or card (PayPal) at checkout in {country.flag} {country.name}.
      </p>

      <ul className="mt-6 space-y-2">
        <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <Banknote className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-black">Pay cash</p>
            <p className="mt-1 text-xs text-gray-500">
              Pay the driver directly. Platform fee comes from the driver wallet
              after the trip.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-black">Pay card (PayPal)</p>
            <p className="mt-1 text-xs text-gray-500">
              Pay the full fare online. Driver is credited ~90% when the trip
              completes.
            </p>
          </div>
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-bold text-black">
        Also in {country.name}
      </h2>
      <ul className="mt-3 space-y-2">
        {country.payments.map((method) => (
          <li key={method} className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-black">
              {paymentLabel(method)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{paymentHint(method)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
