"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { paymentHint, paymentLabel } from "@/lib/countries";

export default function PaymentMethodsPage() {
  const { country } = useCountry();

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-24 pt-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A4D3A] transition active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Payment Methods</h1>
      <p className="mt-2 text-sm text-slate-500">
        Options for {country.flag} {country.name} ({country.currencySymbol}).
      </p>
      <ul className="mt-6 space-y-3">
        {country.payments.map((method) => (
          <li
            key={method}
            className="rounded-xl border border-gray-100 bg-[#F9FAFB] p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-900">
              {paymentLabel(method)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{paymentHint(method)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
