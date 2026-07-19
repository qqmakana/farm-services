"use client";

import { useEffect, useMemo, useState } from "react";
import { listDriverJobs } from "@/lib/actions";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
import type { JobWithDriver } from "@/lib/types";

type Tx = {
  id: string;
  label: string;
  amount: number;
  at: string;
};

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

export function DriverEarningsView() {
  const { driver, refresh } = useDriverApp();
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    if (!driver?.id) return;
    void listDriverJobs(driver.id).then(setJobs);
    refresh();
  }, [driver?.id, refresh]);

  const wallet = Number(driver?.wallet_balance ?? 0);
  const owed = Number(driver?.commission_owed ?? 0);

  const completed = useMemo(
    () => jobs.filter((j) => j.status === "completed"),
    [jobs],
  );

  const weekStats = useMemo(() => {
    const from = startOfWeek().getTime();
    const week = completed.filter(
      (j) => new Date(j.completed_at || j.created_at).getTime() >= from,
    );
    const total = week.reduce((s, j) => s + Number(j.fee_amount || 0), 0);
    const trips = week.length;
    const avg = trips ? Math.round(total / trips) : 0;
    return { total, trips, avg };
  }, [completed]);

  const transactions = useMemo(() => {
    const rows: Tx[] = [];
    for (const j of completed.slice(0, 20)) {
      const fee = Number(j.fee_amount) || 0;
      const commission =
        Number(j.platform_commission) > 0
          ? Math.round(Number(j.platform_commission))
          : Math.round((fee * 15) / 100);
      const at = j.completed_at || j.created_at;
      rows.push({
        id: `${j.id}-earn`,
        label: `Trip ${j.reference_code}`,
        amount: fee,
        at,
      });
      rows.push({
        id: `${j.id}-comm`,
        label: `Commission · ${j.reference_code}`,
        amount: -commission,
        at,
      });
    }
    return rows.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [completed]);

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Wallet, commission &amp; weekly stats
      </p>

      <section className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Wallet balance
        </p>
        <p
          className={`mt-1 text-4xl font-bold ${
            wallet < 0 ? "text-rose-600" : "text-[#1A4D3A]"
          }`}
        >
          {formatMoney(wallet)}
        </p>
        {owed > 0 || wallet < 0 ? (
          <p className="mt-2 text-sm font-semibold text-orange-700">
            Commission owed: {formatMoney(owed || Math.abs(Math.min(0, wallet)))}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No commission debt</p>
        )}

        <button
          type="button"
          onClick={() => setShowTopUp((v) => !v)}
          className="mt-4 w-full rounded-xl bg-[#1A4D3A] py-3.5 text-sm font-bold text-white transition active:scale-95"
        >
          Top Up Wallet
        </button>

        {showTopUp ? (
          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">How to top up</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>
                Send eWallet / Send-iMali / EFT to{" "}
                <strong>{BRAND.phone}</strong>
              </li>
              <li>Use your name + phone as the payment reference</li>
              <li>WhatsApp proof of payment — ops will credit your wallet</li>
            </ol>
          </div>
        ) : null}
      </section>

      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase">
          This week
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          This Week: {formatMoney(weekStats.total)} · Trips: {weekStats.trips} ·
          Avg: {formatMoney(weekStats.avg)}/trip
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold text-slate-900">Recent activity</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Complete trips to see earnings and commission here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {tx.amount >= 0 ? "+" : ""}
                    {formatMoney(tx.amount)} · {tx.label}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.at).toLocaleString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={
                    tx.amount >= 0
                      ? "font-bold text-emerald-700"
                      : "font-bold text-orange-700"
                  }
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatMoney(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
