import { getSiteUrl } from "@/lib/app-links";

const YOCO_API = "https://payments.yoco.com/api";

export function isYocoConfigured() {
  const secret = process.env.YOCO_SECRET_KEY?.trim() ?? "";
  if (secret.length < 16) return false;
  if (/your[_./]|example|placeholder/i.test(secret)) return false;
  return /^(yoco_|sk_)/i.test(secret);
}

/** Client can show Card when the public flag is on (secret stays server-only). */
export function isYocoPublicEnabled() {
  const flag = process.env.NEXT_PUBLIC_YOCO_ENABLED?.trim() ?? "";
  return flag === "1" || flag.toLowerCase() === "true";
}

function secret() {
  const key = process.env.YOCO_SECRET_KEY?.trim() ?? "";
  if (!isYocoConfigured()) {
    throw new Error("Yoco is not configured. Add YOCO_SECRET_KEY on the server.");
  }
  return key;
}

export type YocoCheckout = {
  id: string;
  status: "created" | "started" | "processing" | "completed" | string;
  amount: number;
  currency: string;
  redirectUrl: string;
  paymentId: string | null;
};

export function zarToCents(amountZar: number) {
  return Math.max(1, Math.round(Number(amountZar) * 100));
}

export async function yocoCreateCheckout(params: {
  amountZar: number;
  description: string;
  successPath?: string;
  cancelPath?: string;
  metadata?: Record<string, string>;
}): Promise<YocoCheckout> {
  const site = getSiteUrl();
  const res = await fetch(`${YOCO_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: zarToCents(params.amountZar),
      currency: "ZAR",
      successUrl: `${site}${params.successPath ?? "/yoco/complete"}`,
      cancelUrl: `${site}${params.cancelPath ?? "/ride"}`,
      failureUrl: `${site}${params.cancelPath ?? "/ride"}`,
      metadata: params.metadata ?? { source: "village-ride" },
      clientReferenceId: `vr-${Date.now().toString(36)}`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yoco checkout failed: ${text.slice(0, 280)}`);
  }
  const data = (await res.json()) as YocoCheckout;
  if (!data.id || !data.redirectUrl) {
    throw new Error("Yoco did not return a checkout link.");
  }
  return data;
}

export async function yocoGetCheckout(checkoutId: string): Promise<YocoCheckout> {
  const res = await fetch(
    `${YOCO_API}/checkouts/${encodeURIComponent(checkoutId)}`,
    { headers: { Authorization: `Bearer ${secret()}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yoco lookup failed: ${text.slice(0, 280)}`);
  }
  return (await res.json()) as YocoCheckout;
}

export async function yocoConfirmPaid(checkoutId: string): Promise<YocoCheckout> {
  const checkout = await yocoGetCheckout(checkoutId);
  if (checkout.status !== "completed" || !checkout.paymentId) {
    throw new Error(
      "Card payment is not complete yet. If you were charged, wait a moment and tap Back.",
    );
  }
  return checkout;
}

export function looksLikeYocoCheckoutId(id: string) {
  return /^checkout_/i.test(id.trim());
}
