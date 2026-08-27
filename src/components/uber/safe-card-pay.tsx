"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { readPaypalApproveUrl, stashPaypalApproveUrl } from "@/lib/paypal-draft";

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

function paypalReady() {
  const id = clientId.trim();
  if (!id) return false;
  if (/your[_./]|example|placeholder/i.test(id) || id.length < 10) return false;
  return true;
}

function allowLocalTestPay() {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * Card pay without the PayPal JS SDK — that SDK crashes in the Play TWA /
 * old WebViews ("could not load PayPal"). We create the order on the server
 * and open PayPal's own checkout page.
 */
export function SafeCardPay({
  amount,
  description,
  disabled,
  submitLabel,
  onCreateOrder,
  onApprove,
  onLocalPay,
}: {
  amount: number;
  description: string;
  disabled?: boolean;
  submitLabel?: string;
  onCreateOrder: () => Promise<
    string | { orderId: string; approveUrl?: string | null }
  >;
  onApprove: (orderId: string) => Promise<void>;
  onLocalPay?: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  void onApprove;
  void description;

  if (!paypalReady()) {
    if (!allowLocalTestPay() || !onLocalPay) {
      return (
        <p className="rounded-2xl bg-[#F3F3F3] px-4 py-3 text-[13px] text-[#6B6B6B]">
          Card is temporarily unavailable. Pay the driver in cash.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {error ? (
          <p className="rounded-xl bg-[#fdecea] px-3 py-2 text-[13px] text-[#b01000]">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            setError(null);
            setBusy(true);
            void onLocalPay()
              .catch((e) => {
                setError(e instanceof Error ? e.message : "Payment failed");
              })
              .finally(() => setBusy(false));
          }}
          className="uber-press min-h-12 w-full rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
        >
          {busy
            ? "Creating trip…"
            : `${submitLabel ?? "Pay"} · ${formatMoney(amount)}`}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="rounded-xl bg-[#fdecea] px-3 py-2 text-[13px] text-[#b01000]">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => {
          setError(null);
          setBusy(true);
          void (async () => {
            try {
              const created = await onCreateOrder();
              const approveUrl =
                typeof created === "string"
                  ? null
                  : created.approveUrl ?? null;
              if (approveUrl) stashPaypalApproveUrl(approveUrl);
              const url = approveUrl || readPaypalApproveUrl();
              if (!url) {
                throw new Error(
                  "PayPal did not open. Choose Cash, or try Card again.",
                );
              }
              window.location.assign(url);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not start card payment.",
              );
              setBusy(false);
            }
          })();
        }}
        className="uber-press min-h-12 w-full rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
      >
        {busy
          ? "Opening PayPal…"
          : `${submitLabel ?? "Pay with PayPal"} · ${formatMoney(amount)}`}
      </button>
      <p className="text-center text-[12px] text-[#6B6B6B]">
        PayPal opens to finish card payment, then brings you back here.
      </p>
    </div>
  );
}
