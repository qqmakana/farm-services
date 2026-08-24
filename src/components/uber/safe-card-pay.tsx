"use client";

import dynamic from "next/dynamic";
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";

const PayPalCheckout = dynamic(
  () => import("@/components/paypal-checkout").then((m) => m.PayPalCheckout),
  {
    ssr: false,
    loading: () => (
      <p className="py-3 text-center text-[13px] text-[#6B6B6B]">
        Loading card…
      </p>
    ),
  },
);

/** PayPal loads only after Card is selected, so cash booking never pulls the SDK. */
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
  onCreateOrder: () => Promise<string>;
  onApprove: (orderId: string) => Promise<void>;
  onLocalPay?: () => Promise<void>;
}) {
  return (
    <ClientErrorBoundary
      fallback={
        <div className="rounded-2xl bg-[#fdecea] px-3 py-3 text-[13px] text-[#b01000]">
          Card (PayPal) could not load on this phone. Choose Cash to book, or
          open Village Ride in Chrome.
        </div>
      }
    >
      <PayPalCheckout
        amount={amount}
        description={description}
        disabled={disabled}
        submitLabel={submitLabel}
        onCreateOrder={onCreateOrder}
        onApprove={onApprove}
        onLocalPay={onLocalPay}
      />
    </ClientErrorBoundary>
  );
}
