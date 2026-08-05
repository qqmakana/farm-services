"use client";

import { useTransition, useState } from "react";
import { calculateAndDistributeCityBonus } from "@/lib/actions-founding-bonus";
import type { CityBonusRow } from "@/lib/actions-founding-bonus";
import { formatMoney } from "@/lib/format";
import { centsToRands } from "@/lib/founding-driver";

export function BonusPayoutsBoard({
  monthYear,
  initialRows,
}: {
  monthYear: string;
  initialRows: CityBonusRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [pendingCity, setPendingCity] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  function distribute(city: string) {
    setMessage(null);
    setError(null);
    setPendingCity(city);
    start(async () => {
      try {
        const res = await calculateAndDistributeCityBonus(city, monthYear);
        setRows((prev) =>
          prev.map((r) =>
            r.city === city
              ? {
                  ...r,
                  is_distributed: true,
                  bonus_pool_cents: res.bonus_pool_cents,
                  founding_driver_count: res.founding_driver_count,
                }
              : r,
          ),
        );
        setMessage(
          `${city}: distributed ${formatMoney(centsToRands(res.bonus_pool_cents))} across ${res.founding_driver_count} founding drivers (${formatMoney(centsToRands(res.bonus_each_cents))} each).`,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Distribute failed");
      } finally {
        setPendingCity(null);
      }
    });
  }

  return (
    <div className="mt-6 space-y-3">
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.city}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-black">{row.city}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Month {row.month_year} · Platform fees{" "}
                  {formatMoney(centsToRands(row.total_gross_revenue_cents))}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  2% bonus pool{" "}
                  {formatMoney(centsToRands(row.bonus_pool_cents))} ·{" "}
                  {row.founding_driver_count} founding driver
                  {row.founding_driver_count === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs font-semibold tracking-wide uppercase">
                  {row.is_distributed ? (
                    <span className="text-emerald-700">Distributed</span>
                  ) : (
                    <span className="text-amber-700">Pending</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={
                  row.is_distributed ||
                  pendingCity === row.city ||
                  row.founding_driver_count < 1 ||
                  row.total_gross_revenue_cents < 1
                }
                onClick={() => distribute(row.city)}
                className="uber-press rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pendingCity === row.city
                  ? "Working…"
                  : "Calculate & Distribute 2% Bonus"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
