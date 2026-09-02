import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/format";

/** Rider may cancel free within this window after booking. */
export const CANCEL_FREE_MINUTES = 2;
/** Goes to the assigned driver if the rider cancels after the free window. */
export const CANCEL_FEE_ZAR = 15;
/** Estimated Yoco take on card — ops ledger only, not charged in-app. */
export const YOCO_FEE_PCT = 2.95;
/** First N approved drivers get the launch sign-up bonus. */
export const LAUNCH_DRIVER_BONUS_SLOTS = 10;
export const LAUNCH_DRIVER_BONUS_ZAR = 100;
export const LAUNCH_DRIVER_BONUS_TRIPS = 5;
/** Shop goods commission is 0% for this many days after the shop is created. */
export const SHOP_LAUNCH_FREE_DAYS = 30;
export const MIN_EARN_HOURS = 6;
export const MIN_EARN_ZAR = 150;

export const CANCEL_POLICY_LINE =
  `Cancel within ${CANCEL_FREE_MINUTES} min, full refund. After ${CANCEL_FREE_MINUTES} min, ${formatMoney(CANCEL_FEE_ZAR)} cancellation fee goes to the driver.`;

export const CANCEL_POLICY_DETAIL = [
  `Cancel within ${CANCEL_FREE_MINUTES} minutes of booking: full refund. If you paid by card, Village Ride refunds you in the Yoco dashboard (card refunds can take 2–7 days to show on your bank).`,
  `After ${CANCEL_FREE_MINUTES} minutes, if a driver is already assigned or on the way: ${formatMoney(CANCEL_FEE_ZAR)} goes to that driver for wasted time. The rest of a card payment is refunded.`,
  "Village Pass trips: free cancellation while the trip has not started.",
  "If a shop is out of stock or cancels, WhatsApp Village Ride with Dispute. We refund you in Yoco; we do not leave money stuck without a note.",
  `Driver arrives and the shop has no order: WhatsApp ${BRAND.phone}. Ops pays the driver a ${formatMoney(CANCEL_FEE_ZAR)} wasted-trip fee and refunds the rider.`,
].join(" ");

export function cancelFeeApplies(input: {
  createdAt: string;
  status: string;
  villagePass?: boolean | null;
  now?: Date;
}): boolean {
  if (input.villagePass) return false;
  if (
    input.status === "new" ||
    input.status === "searching_driver"
  ) {
    return false;
  }
  if (
    input.status !== "assigned" &&
    input.status !== "confirmed"
  ) {
    return false;
  }
  const start = new Date(input.createdAt).getTime();
  if (!Number.isFinite(start)) return false;
  const elapsedMin = ((input.now ?? new Date()).getTime() - start) / 60000;
  return elapsedMin >= CANCEL_FREE_MINUTES;
}

export function shopIsLaunchFree(createdAt?: string | null, now = Date.now()) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t < SHOP_LAUNCH_FREE_DAYS * 24 * 60 * 60 * 1000;
}

export function estimateYocoFee(amountZar: number) {
  return Math.round((Math.max(0, amountZar) * YOCO_FEE_PCT) / 100);
}
