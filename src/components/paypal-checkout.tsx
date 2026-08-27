"use client";

import { SafeCardPay } from "@/components/uber/safe-card-pay";

/**
 * Card checkout without the PayPal JS SDK (that SDK crashes in the Play TWA).
 * Same props as before so farm/delivery/shop forms keep working.
 */
export function PayPalCheckout({
  amount,
  description,
  disabled,
  onCreateOrder,
  onApprove,
  onLocalPay,
  submitLabel,
}: {
  amount: number;
  description: string;
  disabled?: boolean;
  onCreateOrder: () => Promise<
    string | { orderId: string; approveUrl?: string | null }
  >;
  onApprove: (orderId: string) => Promise<void>;
  onLocalPay?: () => Promise<void>;
  submitLabel?: string;
}) {
  return (
    <SafeCardPay
      amount={amount}
      description={description}
      disabled={disabled}
      submitLabel={submitLabel}
      onCreateOrder={onCreateOrder}
      onApprove={onApprove}
      onLocalPay={onLocalPay}
    />
  );
}
