import { getCountry } from "./countries";

/** Legacy % remittance when booking_fee / flat-fee fields are absent. */
export const DEFAULT_COMMISSION_PCT = 10;

/**
 * Post-Paid / Earn First model:
 * - New drivers start at R0 — no deposit to go online.
 * - Cash trips: platform fee deducted; balance may go negative.
 * - Card trips: credit payout only (never creates debt).
 * - Hard credit limit: −R100 ZA (scaled for other markets).
 */
export const WALLET_CREDIT_LIMIT_ZAR = 100;

/** @deprecated Prefer walletCreditFloor(country) — ZA default for messages/tests. */
export const WALLET_ONLINE_FLOOR = -WALLET_CREDIT_LIMIT_ZAR;

/** Absolute credit limit in local currency (positive number). */
export function walletCreditLimitAmount(
  countryCode?: string | null,
): number {
  const c = getCountry(countryCode);
  if (c.currency === "ZAR") return WALLET_CREDIT_LIMIT_ZAR;
  const ratio = c.pricing.ride.base / 15;
  return Math.max(1, Math.round(WALLET_CREDIT_LIMIT_ZAR * ratio));
}

/** Hard floor: balance must be >= this to go online / receive offers. */
export function walletCreditFloor(countryCode?: string | null): number {
  return -walletCreditLimitAmount(countryCode);
}

/** Warn (red UI) when debt is deep but still within the limit. */
export function isApproachingCreditLimit(
  balance: number,
  countryCode?: string | null,
): boolean {
  const floor = walletCreditFloor(countryCode);
  const bal = Number(balance) || 0;
  if (bal >= 0) return false;
  // Warn in the lower 30% of the credit band (e.g. ≤ −70 when floor is −100)
  const warnAt = Math.round(floor * 0.7);
  return bal <= warnAt;
}

export function creditLimitBlockMessage(countryCode?: string | null): string {
  const limit = walletCreditLimitAmount(countryCode);
  const c = getCountry(countryCode);
  const label =
    c.currency === "ZAR" ? `R${limit}` : `${c.currencySymbol}${limit}`;
  return `You have reached your ${label} credit limit. Please top up your wallet via WhatsApp to continue receiving jobs.`;
}

/** Apply platform commission to a driver's wallet after a CASH trip completes. */
export function applyCommissionToWallet(params: {
  walletBalance: number;
  commission: number;
}): {
  wallet_balance: number;
  commission_owed: number;
} {
  const commission = Math.max(0, Math.round(Number(params.commission) || 0));
  const next = Number(params.walletBalance || 0) - commission;
  return {
    wallet_balance: next,
    commission_owed: next < 0 ? Math.abs(next) : 0,
  };
}

/**
 * Cash Scenario A — amount to deduct from driver prepaid wallet on complete.
 *
 * New quotes: stored `platform_commission` is 10% of the rider fare.
 * Legacy flat-fee jobs: deduct `booking_fee` only (0 with old Village Pass).
 * Oldest jobs: ~10% of fee.
 */
export function cashPlatformRemittance(job: {
  fee_amount?: number | null;
  booking_fee?: number | null;
  platform_commission?: number | null;
  driver_payout?: number | null;
  village_pass?: boolean | null;
  base_fare?: number | null;
  total_fare?: number | null;
}): number {
  const fee = Number(job.fee_amount) || 0;
  const storedCommission = Number(job.platform_commission) || 0;
  const bookingFee = Math.max(0, Math.round(Number(job.booking_fee) || 0));

  if (storedCommission > 0) return Math.round(storedCommission);

  const flatFeeModel =
    job.village_pass === true ||
    job.base_fare != null ||
    job.total_fare != null ||
    (job.driver_payout != null && Number(job.driver_payout) > 0) ||
    (job.platform_commission != null &&
      Number(job.platform_commission) === 0 &&
      job.booking_fee != null);

  if (flatFeeModel) return bookingFee;
  return Math.round((fee * DEFAULT_COMMISSION_PCT) / 100);
}

/** Card Scenario B — credit driver (total − platform fee). */
export function cardDriverPayout(job: {
  fee_amount?: number | null;
  booking_fee?: number | null;
  platform_commission?: number | null;
  driver_payout?: number | null;
  village_pass?: boolean | null;
  base_fare?: number | null;
  total_fare?: number | null;
}): number {
  const fee = Number(job.fee_amount) || 0;
  if (job.driver_payout != null && Number(job.driver_payout) > 0) {
    return Math.round(Number(job.driver_payout));
  }
  const remit = cashPlatformRemittance(job);
  return Math.max(0, fee - remit);
}

/** Credit driver's payout after a CARD/PayPal trip (platform already received 100%). */
export function creditPayoutToWallet(params: {
  walletBalance: number;
  payout: number;
}): {
  wallet_balance: number;
  commission_owed: number;
} {
  const payout = Math.max(0, Math.round(Number(params.payout) || 0));
  const next = Number(params.walletBalance || 0) + payout;
  return {
    wallet_balance: next,
    commission_owed: next < 0 ? Math.abs(next) : 0,
  };
}

/**
 * Drivers at or above the credit floor can go online and receive offers.
 * Below the floor (e.g. < −R100) → hard stop until top-up.
 */
export function driverEligibleForDispatch(driver: {
  wallet_balance?: number | null;
  country_code?: string | null;
}): boolean {
  const bal = Number(driver.wallet_balance ?? 0);
  return bal >= walletCreditFloor(driver.country_code);
}

/** Cash 10% the driver still owes Village Ride (Sunday settlement). */
export function amountOwedToPlatform(
  walletBalance?: number | null,
  commissionOwed?: number | null,
): number {
  return Math.max(
    Math.round(Number(commissionOwed) || 0),
    Math.round(-Math.min(0, Number(walletBalance) || 0)),
  );
}

export function isCashPaymentMethod(
  method: string | null | undefined,
): boolean {
  return method === "cash" || !method;
}

export function isCardPaymentMethod(
  method: string | null | undefined,
): boolean {
  return method === "card" || method === "paypal";
}
