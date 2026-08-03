"use client";

import { formatMoney } from "@/lib/format";

/** Ask driver to confirm cash was collected before completing a cash trip. */
export function CashCollectModal({
  amount,
  currency,
  countryCode,
  pending,
  onYes,
  onNo,
  onCancel,
}: {
  amount: number;
  currency?: string | null;
  countryCode?: string | null;
  pending?: boolean;
  onYes: () => void;
  onNo: () => void;
  onCancel: () => void;
}) {
  const money = formatMoney(amount, currency ?? undefined, countryCode);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-collect-title"
        className="ru-card w-full max-w-md p-5 !shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
      >
        <p className="ru-section-label">Cash trip</p>
        <h2
          id="cash-collect-title"
          className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-black"
        >
          Did the rider pay {money} in cash?
        </h2>
        <p className="mt-2 text-sm text-[var(--ru-muted)]">
          If yes, we deduct ~15% platform fee from your prepaid wallet. If no,
          the trip is flagged for ops — no fee deducted yet.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onYes}
            className="ru-btn ru-btn-primary ru-btn-block"
          >
            {pending ? "Saving…" : `Yes — paid ${money}`}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onNo}
            className="ru-btn ru-btn-secondary ru-btn-block"
          >
            No — flag for ops
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="ru-btn ru-btn-ghost ru-btn-block"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
