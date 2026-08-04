"use client";

import { Banknote, CreditCard } from "lucide-react";

export type CheckoutPaymentChoice = "cash" | "card";

/** Uber-style payment row — tight list, black selected state. */
export function PaymentSelector({
  value,
  onChange,
  currencyLabel = "",
}: {
  value: CheckoutPaymentChoice;
  onChange: (next: CheckoutPaymentChoice) => void;
  currencyLabel?: string;
}) {
  return (
    <div
      data-testid="payment-selector"
      className="space-y-1"
      role="radiogroup"
      aria-label="Payment method"
    >
      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
        Payment
      </p>
      {(
        [
          {
            id: "cash" as const,
            title: "Cash",
            sub: `Pay driver${currencyLabel ? ` (${currencyLabel})` : ""}`,
            Icon: Banknote,
            testId: "pay-cash",
          },
          {
            id: "card" as const,
            title: "Card",
            sub: "PayPal",
            Icon: CreditCard,
            testId: "pay-card",
          },
        ] as const
      ).map((opt) => {
        const selected = value === opt.id;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={opt.testId}
            data-selected={selected ? "true" : "false"}
            onClick={() => onChange(opt.id)}
            className={`uber-press flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
              selected ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                selected ? "bg-black text-white" : "bg-gray-200 text-black"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-black">
                {opt.title}
              </span>
              <span className="block text-xs text-gray-500">{opt.sub}</span>
            </span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selected ? "border-black bg-black" : "border-gray-300"
              }`}
              aria-hidden
            >
              {selected ? (
                <span className="h-2 w-2 rounded-full bg-white" />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
