"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import {
  readPaypalApproveUrl,
  stashCardCheckoutId,
  stashPaypalApproveUrl,
} from "@/lib/paypal-draft";
import { isYocoPublicEnabled } from "@/lib/yoco";

function cardReady() {
  return isYocoPublicEnabled();
}

function allowLocalTestPay() {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * Card pay without a JS SDK — old WebViews crash SDKs. Server creates a
 * Yoco hosted checkout — we open that page. No PayPal SDK.
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

  if (!cardReady()) {
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
          <p className="text-[12px] text-[#CB4040]">{error}</p>
        ) : null}
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            setError(null);
            setBusy(true);
            void onLocalPay()
              .catch((e) => {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Payment failed. Try again or use a different card.",
                );
              })
              .finally(() => setBusy(false));
          }}
          className="uber-press uber-btn-black w-full"
        >
          {busy ? <ButtonSpinner /> : `${submitLabel ?? "Pay"} · ${formatMoney(amount)}`}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
              if (typeof created !== "string" && created.orderId) {
                stashCardCheckoutId(created.orderId);
              }
              if (approveUrl) stashPaypalApproveUrl(approveUrl);
              const url = approveUrl || readPaypalApproveUrl();
              if (!url) {
                throw new Error(
                  "Payment failed. Try again or use a different card.",
                );
              }
              window.location.assign(url);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Payment failed. Try again or use a different card.",
              );
              setBusy(false);
            }
          })();
        }}
        className="uber-press uber-btn-black w-full"
      >
        {busy ? (
          <ButtonSpinner />
        ) : (
          `${submitLabel ?? "Pay with card"} · ${formatMoney(amount)}`
        )}
      </button>
      {error ? <p className="text-[12px] text-[#CB4040]">{error}</p> : null}
      <p className="text-center text-[12px] text-[#666666]">
        Yoco opens to finish card payment, then brings you back here.
      </p>
    </div>
  );
}
