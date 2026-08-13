"use client";

import { Banknote, CreditCard } from "lucide-react";

export type CheckoutPaymentChoice = "cash" | "card";

/** Uber-style payment row — tight list, black selected state. */
export function PaymentSelector({
  value,
  onChange,
  currencyLabel = "",
  compact = false,
}: {
  value: CheckoutPaymentChoice;
  onChange: (next: CheckoutPaymentChoice) => void;
  currencyLabel?: string;
  compact?: boolean;
}) {
  const options = [
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
  ] as const;

  return (
    <div
      data-testid="payment-selector"
      className={compact ? "grid grid-cols-2 gap-2" : "space-y-1"}
      role="radiogroup"
      aria-label="Payment method"
    >
      {compact ? null : (
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Payment
        </p>
      )}
      {options.map((opt) => {
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
            className={`uber-press flex w-full items-center text-left ${
              compact
                ? `gap-2 rounded-xl px-3 py-2.5 ${
                    selected
                      ? "bg-black text-white"
                      : "bg-gray-100 text-black hover:bg-gray-200"
                  }`
                : `gap-3 rounded-2xl px-3 py-3 ${
                    selected ? "bg-gray-100" : "hover:bg-gray-50"
                  }`
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full ${
                compact
                  ? `h-8 w-8 ${selected ? "bg-white/15 text-white" : "bg-white text-black"}`
                  : `h-9 w-9 ${selected ? "bg-black text-white" : "bg-gray-200 text-black"}`
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-sm font-bold ${compact ? "" : "text-black"}`}
              >
                {opt.title}
              </span>
              {compact ? null : (
                <span className="block text-xs text-gray-500">{opt.sub}</span>
              )}
            </span>
            {compact ? null : (
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
            )}
          </button>
        );
      })}
    </div>
  );
}
