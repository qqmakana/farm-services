import { scaleAmount } from "./pricing";

/** ZA tip chips — 100% to the driver, paid in cash. */
export const TIP_PRESETS_ZAR = [0, 5, 10, 20, 50] as const;

export function tipPresetAmounts(countryCode?: string | null): number[] {
  return TIP_PRESETS_ZAR.map((n) =>
    n === 0 ? 0 : scaleAmount(n, countryCode),
  );
}

export function tipAmountFromDetails(details: unknown): number | null {
  if (!details || typeof details !== "object") return null;
  const raw = (details as { tip_amount?: unknown }).tip_amount;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function mergeTipIntoDetails(
  details: unknown,
  amount: number,
): Record<string, unknown> {
  const base =
    details && typeof details === "object"
      ? { ...(details as Record<string, unknown>) }
      : {};
  base.tip_amount = Math.max(0, Math.round(Number(amount) || 0));
  return base;
}
