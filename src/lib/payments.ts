import type { PaymentMethod } from "./types";

export type CardPayload = {
  holderName: string;
  number: string;
  expiry: string; // MM/YY
  cvc: string;
};

export type { PaymentMethod };

/** Demo charge — validates card shape like a gateway, no real money moved. */
export function chargeCard(
  amountZar: number,
  card: CardPayload,
): { ok: true; last4: string; reference: string } | { ok: false; error: string } {
  const digits = card.number.replace(/\s+/g, "");
  if (!/^\d{16}$/.test(digits)) {
    return { ok: false, error: "Enter a valid 16-digit card number." };
  }
  if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
    return { ok: false, error: "Expiry must be MM/YY." };
  }
  const [mm, yy] = card.expiry.split("/").map(Number);
  if (mm < 1 || mm > 12) {
    return { ok: false, error: "Invalid expiry month." };
  }
  const now = new Date();
  const expYear = 2000 + yy;
  const expMonthEnd = new Date(expYear, mm, 0);
  if (expMonthEnd < now) {
    return { ok: false, error: "Card is expired." };
  }
  if (!/^\d{3,4}$/.test(card.cvc)) {
    return { ok: false, error: "Invalid CVC." };
  }
  if (!card.holderName.trim()) {
    return { ok: false, error: "Cardholder name required." };
  }
  if (amountZar <= 0) {
    return { ok: false, error: "Invalid fare amount." };
  }

  return {
    ok: true,
    last4: digits.slice(-4),
    reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
  };
}

export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
