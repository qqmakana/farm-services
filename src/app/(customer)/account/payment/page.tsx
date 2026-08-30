"use client";

import Link from "next/link";
import { ArrowLeft, Banknote, CreditCard } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { paymentHint, paymentLabel } from "@/lib/countries";
import {
  UBER_GLOSS,
  UBER_H1,
  UBER_H2,
  UBER_PAGE,
  UBER_SUB,
} from "@/components/customer/uber-chrome";

export default function PaymentMethodsPage() {
  const { country } = useCountry();

  return (
    <main className={UBER_PAGE}>
      <Link
        href="/account"
        className={`uber-press inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-[#0a0a0a] ${UBER_GLOSS}`}
      >
        <ArrowLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className={`mt-5 ${UBER_H1}`}>Payment</h1>
      <p className={UBER_SUB}>
        Cash or card (Yoco) at checkout in {country.flag} {country.name}.
      </p>

      <ul className="mt-6 space-y-3">
        <li className={`flex items-start gap-3 rounded-[28px] p-4 ${UBER_GLOSS}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <Banknote className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[#0a0a0a]">Pay cash</p>
            <p className="mt-1 text-[13px] font-medium text-[#6b6b6b]">
              Pay the driver directly. Platform fee comes from the driver wallet
              after the trip.
            </p>
          </div>
        </li>
        <li className={`flex items-start gap-3 rounded-[28px] p-4 ${UBER_GLOSS}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[#0a0a0a]">Pay card (Yoco)</p>
            <p className="mt-1 text-[13px] font-medium text-[#6b6b6b]">
              Pay the full fare online. Driver is credited ~90% when the trip
              completes.
            </p>
          </div>
        </li>
      </ul>

      <h2 className={`mt-8 ${UBER_H2}`}>
        Also in {country.name}
      </h2>
      <ul className="mt-3 space-y-3">
        {country.payments.map((method) => (
          <li key={method} className={`rounded-[28px] p-4 ${UBER_GLOSS}`}>
            <p className="text-[15px] font-bold text-[#0a0a0a]">
              {paymentLabel(method)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#6b6b6b]">{paymentHint(method)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
