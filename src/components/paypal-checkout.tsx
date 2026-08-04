"use client";

import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "ZAR";

function paypalReady() {
  const id = clientId.trim();
  if (!id) return false;
  if (/your[_./]|example|placeholder/i.test(id) || id.length < 10) return false;
  return true;
}

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
  onCreateOrder: () => Promise<string>;
  onApprove: (orderId: string) => Promise<void>;
  /** Used when PayPal keys are not set yet — local click-through testing. */
  onLocalPay?: () => Promise<void>;
  /** Primary CTA label in local-test mode (e.g. Request Ride). */
  submitLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!paypalReady()) {
    return (
      <section className="rounded-2xl border border-[var(--ru-line)] bg-[var(--ru-elevated)] p-5 text-sm text-[var(--ru-ink)]">
        <p className="font-semibold">Card (local test mode)</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ru-muted)]">
          PayPal keys are empty — this books a paid card trip for local testing.
          Add{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>{" "}
          and{" "}
          <code className="rounded bg-white px-1">PAYPAL_CLIENT_SECRET</code> for
          live PayPal.
        </p>
        {error && (
          <p className="mt-3 rounded-xl bg-[#fdecea] px-3 py-2 text-sm text-[#b01000]">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={disabled || pending || !onLocalPay}
          onClick={() => {
            if (!onLocalPay) return;
            setError(null);
            startTransition(async () => {
              try {
                await onLocalPay();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Local payment failed");
              }
            });
          }}
          className="uber-press uber-btn-black mt-2 w-full"
        >
          {pending
            ? "Creating trip…"
            : disabled
              ? "Complete the form first"
              : submitLabel
                ? `${submitLabel} · ${formatMoney(amount)}`
                : `Pay ${formatMoney(amount)} (local test)`}
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[var(--ru-ink)] text-white shadow-xl">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
              Pay with PayPal
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
              {formatMoney(amount)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {description} · {currency}
            </p>
          </div>
          <div className="rounded-full bg-[#0070ba]/20 px-3 py-1 text-[11px] font-semibold text-sky-300">
            PayPal
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        {disabled && (
          <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300">
            Complete the form above, then pay with PayPal.
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        <div className={disabled || busy ? "pointer-events-none opacity-50" : ""}>
          <PayPalScriptProvider
            options={{
              clientId,
              currency,
              intent: "capture",
              components: "buttons",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", shape: "rect", label: "pay" }}
              disabled={disabled || busy}
              createOrder={async () => {
                setError(null);
                setBusy(true);
                try {
                  return await onCreateOrder();
                } catch (e) {
                  setBusy(false);
                  const msg =
                    e instanceof Error ? e.message : "Could not start PayPal";
                  setError(msg);
                  throw e;
                }
              }}
              onApprove={async (data) => {
                setError(null);
                setBusy(true);
                try {
                  await onApprove(data.orderID);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "PayPal payment failed",
                  );
                } finally {
                  setBusy(false);
                }
              }}
              onCancel={() => {
                setBusy(false);
                setError("Payment cancelled.");
              }}
              onError={() => {
                setBusy(false);
                setError("PayPal error. Try again.");
              }}
            />
          </PayPalScriptProvider>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-500">
          You pay with your PayPal account / linked card. No cash at the door.
        </p>
      </div>
    </section>
  );
}
