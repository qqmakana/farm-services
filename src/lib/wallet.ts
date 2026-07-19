/** Apply platform commission to a driver's wallet after trip complete. */
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

/** Drivers with wallet_balance < 0 cannot receive auto-dispatch offers. */
export function driverEligibleForDispatch(driver: {
  wallet_balance?: number | null;
}): boolean {
  const bal = Number(driver.wallet_balance ?? 0);
  return bal >= 0;
}

export const DEFAULT_COMMISSION_PCT = 15;
