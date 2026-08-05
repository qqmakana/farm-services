"use client";

import { useEffect, useState, useTransition } from "react";
import { updateDriverHomeCity } from "@/lib/actions-founding-bonus";
import {
  FOUNDING_CITIES,
  centsToRands,
  foundingBonusPayoutWhatsAppHref,
  isWithinFoundingEra,
} from "@/lib/founding-driver";
import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
import { useDriverApp } from "@/components/driver/driver-app-provider";

/** Earnings card — Founding Driver Bonus Pool (performance incentive). */
export function FoundingBonusPoolCard() {
  const { driver, refresh } = useDriverApp();
  const [city, setCity] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [eraOpen, setEraOpen] = useState(false);

  useEffect(() => {
    setEraOpen(isWithinFoundingEra());
    if (driver?.home_city) setCity(driver.home_city);
  }, [driver?.home_city]);

  if (!driver) return null;
  if (!driver.is_founding_driver && !eraOpen) return null;

  const balanceCents = Number(driver.accumulated_bonus_balance ?? 0);
  const balanceRands = centsToRands(balanceCents);
  const homeCity = driver.home_city || "Not set";

  function saveCity() {
    if (!driver?.id || !city) return;
    setError(null);
    start(async () => {
      try {
        await updateDriverHomeCity(driver.id, city);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save city");
      }
    });
  }

  const payoutHref = foundingBonusPayoutWhatsAppHref({
    driverId: driver.id,
    driverName: driver.full_name,
    city: driver.home_city || "unset",
    balanceCents,
    phoneWhatsApp: BRAND.phoneWhatsApp,
  });

  return (
    <section
      data-testid="founding-bonus-pool-card"
      className="ru-card border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5"
    >
      <p className="ru-section-label text-amber-800">Incentive</p>
      <h2 className="mt-1 text-lg font-bold tracking-tight text-black">
        Founding Driver Bonus Pool
      </h2>
      <p className="mt-1 text-xs text-gray-600">
        Performance bonus program — monthly city pool for founding drivers.
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">Accumulated Bonus</p>
          <p className="text-3xl font-bold text-black">
            {formatMoney(balanceRands)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-500">City</p>
          <p className="text-sm font-bold text-black">{homeCity}</p>
        </div>
      </div>

      {driver.is_founding_driver ? (
        <p className="mt-3 rounded-xl bg-amber-100/80 px-3 py-2 text-xs font-semibold text-amber-950">
          Status active
          {driver.founding_era_qualified_at
            ? ` · locked ${new Date(driver.founding_era_qualified_at).toLocaleDateString("en-ZA")}`
            : ""}
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-950">
          Complete your first trip before the Founding Era ends to lock bonus
          pool status.
        </p>
      )}

      {!driver.home_city ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className="ru-soft-field flex-1 text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Select home city</option>
            {FOUNDING_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !city}
            onClick={saveCity}
            className="uber-press uber-btn-black !min-h-11 !px-4 !text-sm"
          >
            Save city
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>
      ) : null}

      <a
        href={payoutHref}
        target="_blank"
        rel="noreferrer"
        className="uber-press uber-btn-black mt-4 flex w-full items-center justify-center !text-sm"
      >
        Request Payout
      </a>
      <p className="mt-2 text-center text-[11px] text-gray-500">
        Opens WhatsApp to Village Ride ops (MVP payout).
      </p>
    </section>
  );
}
