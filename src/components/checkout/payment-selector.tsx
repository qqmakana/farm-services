"use client";

import { Banknote, CreditCard } from "lucide-react";

export type CheckoutPaymentChoice = "cash" | "card";

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
      className="space-y-2"
      role="radiogroup"
      aria-label="Payment method"
    >
      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
        How will you pay?
      </p>
      {(
        [
          {
            id: "cash" as const,
            title: "Pay cash",
            sub: `Pay the driver directly in cash${currencyLabel ? ` (${currencyLabel})` : ""}`,
            Icon: Banknote,
            testId: "pay-cash",
          },
          {
            id: "card" as const,
            title: "Pay card",
            sub: "Pay securely with PayPal (card or balance)",
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
            className={`w-full rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.98] ${
              selected
                ? "border-2 border-[var(--ru-ink)] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                : "border border-gray-100 bg-white hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    selected
                      ? "bg-[var(--ru-ink)] text-white"
                      : "bg-gray-100 text-[var(--ru-ink)]"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-bold text-[var(--ru-ink)]">
                    {opt.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {opt.sub}
                  </span>
                </span>
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected
                    ? "border-[var(--ru-ink)] bg-[var(--ru-ink)]"
                    : "border-gray-300"
                }`}
                aria-hidden
              >
                {selected ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
