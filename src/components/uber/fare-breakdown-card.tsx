"use client";

import { formatMoney } from "@/lib/format";
import { useCountry } from "@/components/country/country-provider";

/** Exact fare lines: base + km = what the rider pays. 10% is included, not added. */
export function FareBreakdownCard({
  baseFare,
  distanceFare,
  platformFee,
  total,
  currency,
  villagePass = false,
  distanceKm,
  reservationFee = 0,
  expressExtra = 0,
  insuranceFee = 0,
}: {
  baseFare: number;
  distanceFare: number;
  platformFee: number;
  total: number;
  currency?: string;
  villagePass?: boolean;
  distanceKm?: number;
  reservationFee?: number;
  expressExtra?: number;
  insuranceFee?: number;
}) {
  const { countryCode } = useCountry();
  const cur = currency;

  return (
    <div
      data-testid="fare-breakdown"
      className="rounded-2xl border border-gray-100 bg-[var(--ru-elevated)] px-4 py-3 text-sm"
    >
      <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">
        Fare breakdown
      </p>
      <dl className="mt-2 space-y-1.5">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Base</dt>
          <dd
            data-testid="base-fare"
            className="font-medium text-[var(--ru-ink)]"
          >
            {formatMoney(baseFare, cur, countryCode)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">
            Distance
            {distanceKm != null && distanceKm > 0
              ? ` (${distanceKm} km)`
              : ""}
          </dt>
          <dd
            data-testid="distance-fare"
            className="font-medium text-[var(--ru-ink)]"
          >
            {formatMoney(distanceFare, cur, countryCode)}
          </dd>
        </div>
        {reservationFee > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Reservation</dt>
            <dd className="font-medium text-[var(--ru-ink)]">
              {formatMoney(reservationFee, cur, countryCode)}
            </dd>
          </div>
        ) : null}
        {expressExtra > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Express (1.5×)</dt>
            <dd className="font-medium text-[var(--ru-ink)]">
              {formatMoney(expressExtra, cur, countryCode)}
            </dd>
          </div>
        ) : null}
        {insuranceFee > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Goods insurance</dt>
            <dd
              data-testid="insurance-fee-line"
              className="font-medium text-[var(--ru-ink)]"
            >
              {formatMoney(insuranceFee, cur, countryCode)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">
            Village Ride 10%
            {villagePass ? " · Pass priority" : ""}
          </dt>
          <dd
            data-testid="platform-fee"
            className="font-medium text-[var(--ru-ink)]"
          >
            {formatMoney(platformFee, cur, countryCode)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-gray-200 pt-1.5">
          <dt className="font-semibold text-[var(--ru-ink)]">You pay</dt>
          <dd
            data-testid="total-fare"
            className="font-bold text-[var(--ru-ink)]"
          >
            {formatMoney(total, cur, countryCode)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-gray-500">
        Cash or card. Driver keeps 90%
        {platformFee > 0
          ? ` (${formatMoney(total - platformFee, cur, countryCode)})`
          : ""}
        . The 10% is included in the fare, not added on top.
      </p>
    </div>
  );
}
