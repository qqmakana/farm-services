"use client";

import { Banknote, ChevronRight, CreditCard } from "lucide-react";

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
      sub: "Yoco",
      Icon: CreditCard,
      testId: "pay-card",
    },
  ] as const;

  return (
    <div
      data-testid="payment-selector"
      className={compact ? "" : "space-y-1"}
      role="radiogroup"
      aria-label="Payment method"
    >
      {compact ? null : (
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Payment
        </p>
      )}
      {value === "cash" ? (
        <p
          data-testid="cash-payment-message"
          className={compact ? "mt-1 text-[12px] text-[#6B6B6B]" : "text-[13px] text-[#6B6B6B]"}
        >
          Pay the driver in cash
        </p>
      ) : null}
      {options.map((opt) => {
        const selected = value === opt.id;
        const Icon = opt.Icon;
        if (compact) {
          const other = options.find((o) => o.id !== value)!;
          if (!selected) {
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked="false"
                data-testid={opt.testId}
                data-selected="false"
                onClick={() => onChange(opt.id)}
                className="sr-only"
              >
                {opt.title}
              </button>
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked="true"
              data-testid={opt.testId}
              data-selected="true"
              onClick={() => onChange(other.id)}
              className="uber-press flex w-full items-center gap-3 py-1 text-left"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center text-white ${
                  opt.id === "cash"
                    ? "rounded-[6px] bg-[#0F7B3A]"
                    : "rounded-full bg-black"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-[16px] font-semibold text-[#0a0a0a]">
                {opt.title}
              </span>
              <ChevronRight className="h-5 w-5 text-[#c4c4c4]" aria-hidden />
            </button>
          );
        }
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={opt.testId}
            data-selected={selected ? "true" : "false"}
            onClick={() => onChange(opt.id)}
            className={`uber-press flex w-full items-center text-left gap-3 rounded-2xl px-3 py-3 ${
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
