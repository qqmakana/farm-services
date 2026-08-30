"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { claimWeeklyTripBonus, listDriverJobs } from "@/lib/actions";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import { FoundingBonusPoolCard } from "@/components/driver/founding-bonus-pool-card";
import { useCountry } from "@/components/country/country-provider";
import { PageShell } from "@/components/ui/page-shell";
import { BRAND, BRAND_TEL_HREF } from "@/lib/brand";
import { getCountry } from "@/lib/countries";
import { formatMoney } from "@/lib/format";
import {
  buildSimpleWalletTopUpMessage,
  buildWalletTopUpMessage,
  walletTopUpWhatsAppHref,
} from "@/lib/whatsapp";
import {
  isApproachingCreditLimit,
  walletCreditFloor,
  walletCreditLimitAmount,
} from "@/lib/wallet";
import type { JobWithDriver } from "@/lib/types";

type Period = "today" | "week" | "month";

type Tx = {
  id: string;
  label: string;
  amount: number;
  at: string;
};

function startOfToday() {
  const x = new Date();
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function periodStart(period: Period) {
  if (period === "today") return startOfToday();
  if (period === "month") return startOfMonth();
  return startOfWeek();
}

export function DriverEarningsView() {
  const { driver, refresh } = useDriverApp();
  const { country: uiCountry } = useCountry();
  const country = getCountry(driver?.country_code || uiCountry.code);
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [period, setPeriod] = useState<Period>("week");
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!driver?.id) return;
    void listDriverJobs(driver.id).then(setJobs);
    refresh();
  }, [driver?.id, refresh]);

  const wallet = Number(driver?.wallet_balance ?? 0);
  const owed = Number(driver?.commission_owed ?? 0);

  useEffect(() => {
    if (owed > 0 || wallet < 0) setShowTopUp(true);
  }, [owed, wallet]);

  const completed = useMemo(
    () => jobs.filter((j) => j.status === "completed"),
    [jobs],
  );

  const periodStats = useMemo(() => {
    const from = periodStart(period).getTime();
    const slice = completed.filter(
      (j) => new Date(j.completed_at || j.created_at).getTime() >= from,
    );
    const gross = slice.reduce((s, j) => s + Number(j.fee_amount || 0), 0);
    const commission = slice.reduce((s, j) => {
      const fee = Number(j.fee_amount) || 0;
      const c =
        Number(j.platform_commission) > 0
          ? Math.round(Number(j.platform_commission))
          : Math.round((fee * 15) / 100);
      return s + c;
    }, 0);
    const trips = slice.length;
    const keep = Math.max(0, gross - commission);
    const avg = trips ? Math.round(keep / trips) : 0;
    return { gross, keep, commission, trips, avg };
  }, [completed, period]);

  const weekTrips = useMemo(() => {
    const from = startOfWeek().getTime();
    return completed.filter(
      (j) => new Date(j.completed_at || j.created_at).getTime() >= from,
    ).length;
  }, [completed]);

  const transactions = useMemo(() => {
    const rows: Tx[] = [];
    for (const j of completed.slice(0, 20)) {
      const fee = Number(j.fee_amount) || 0;
      const commission =
        Number(j.platform_commission) > 0
          ? Math.round(Number(j.platform_commission))
          : Math.round((fee * 15) / 100);
      const payout =
        Number(j.driver_payout) > 0
          ? Math.round(Number(j.driver_payout))
          : Math.max(0, fee - commission);
      const at = j.completed_at || j.created_at;
      const card =
        j.payment_method === "card" || j.payment_method === "paypal";
      if (card) {
        rows.push({
          id: `${j.id}-credit`,
          label: `Card payout ~90% · ${j.reference_code}`,
          amount: payout,
          at,
        });
      } else if (j.cash_collected_confirmed === false) {
        rows.push({
          id: `${j.id}-flag`,
          label: `Cash not confirmed · ${j.reference_code}`,
          amount: 0,
          at,
        });
      } else {
        rows.push({
          id: `${j.id}-earn`,
          label: `Cash from customer · ${j.reference_code}`,
          amount: fee,
          at,
        });
        rows.push({
          id: `${j.id}-comm`,
          label: `Platform ~10% (wallet) · ${j.reference_code}`,
          amount: -commission,
          at,
        });
      }
    }
    return rows.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [completed]);

  const target = 10;
  const bonusProgress = Math.min(1, weekTrips / target);

  function tryClaimBonus() {
    if (!driver?.id) return;
    setBonusMsg(null);
    start(async () => {
      try {
        const res = await claimWeeklyTripBonus(driver.id);
        setBonusMsg(res.message);
        refresh();
        void listDriverJobs(driver.id).then(setJobs);
      } catch (e) {
        setBonusMsg(e instanceof Error ? e.message : "Could not claim bonus");
      }
    });
  }

  const creditFloor = walletCreditFloor(driver?.country_code);
  const creditLimit = walletCreditLimitAmount(driver?.country_code);
  const atLimit = wallet < creditFloor;
  const approaching = isApproachingCreditLimit(wallet, driver?.country_code);

  return (
    <PageShell
      tone="driver"
      title="Earnings"
      subtitle="Post-paid: start at R0. Cash trips deduct the platform fee. Credit limit stops new jobs."
    >
      <FoundingBonusPoolCard />

      <p className="mt-4 rounded-2xl bg-[#F3F3F3] px-4 py-3 text-[13px] text-[#6B6B6B]">
        Card trips are collected by Yoco into Village Ride. Your 90% is paid
        weekly by EFT — Sunday night totals, then marked Paid when sent.
      </p>

      <section className="ru-card mt-4 p-5">
        <p className="ru-section-label">Driver wallet</p>
        <p
          data-testid="wallet-balance"
          className={`mt-1 font-[family-name:var(--font-display)] text-4xl font-bold ${
            wallet < 0 ? "text-[var(--ru-error)]" : "text-black"
          }`}
        >
          {formatMoney(wallet)}
        </p>
        {atLimit ? (
          <p
            data-testid="wallet-warning"
            className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900"
          >
            You have reached your {formatMoney(creditLimit)} credit limit. Top
            up via WhatsApp to continue receiving jobs.
          </p>
        ) : approaching || wallet < 0 ? (
          <p
            data-testid="wallet-warning"
            className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950"
          >
            Balance{" "}
            {formatMoney(wallet)} — credit limit is{" "}
            {formatMoney(creditFloor)}. Owed:{" "}
            {formatMoney(owed || Math.abs(Math.min(0, wallet)))}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--ru-muted)]">
            Earn first, pay later. You can go online at R0. Jobs pause only if
            you hit {formatMoney(creditFloor)}.
          </p>
        )}

        <a
          href={walletTopUpWhatsAppHref(
            BRAND.phoneWhatsApp,
            buildSimpleWalletTopUpMessage(driver?.id || "unknown"),
          )}
          target="_blank"
          rel="noreferrer"
          data-testid="top-up-wallet-button"
          className="ru-btn ru-btn-block mt-4 !bg-[#25D366] !text-white"
        >
          Top Up Wallet
        </a>

        <button
          type="button"
          onClick={() => setShowTopUp((v) => !v)}
          className="ru-btn ru-btn-secondary ru-btn-block mt-2"
        >
          {showTopUp ? "Hide top-up details" : "Top-up details & amount"}
        </button>

        {showTopUp ? (
          <div className="mt-3 space-y-3 rounded-[var(--ru-radius)] border border-[var(--ru-line)] bg-[var(--ru-elevated)] px-4 py-3 text-sm text-[var(--ru-ink)]">
            <p className="font-semibold text-black">How to top up</p>
            <ol className="list-inside list-decimal space-y-1 text-[var(--ru-muted)]">
              <li>
                Pay ops via local cash / eWallet / EFT to{" "}
                <strong className="text-black">{BRAND.phone}</strong>
              </li>
              <li>
                Enter the amount below ({country.currency}) — use this exact
                WhatsApp template so we credit the right wallet
              </li>
              <li>Send proof of payment in the same chat</li>
            </ol>
            <label className="block text-xs font-semibold text-black">
              Amount ({country.currency})
              <input
                type="number"
                min={1}
                inputMode="numeric"
                className="ru-soft-field mt-1 w-full text-sm"
                placeholder={`e.g. ${Math.max(100, Math.round(country.pricing.ride.base * 20))}`}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
            </label>
            {(() => {
              const amount = Math.round(Number(topUpAmount) || 0);
              const msg = buildWalletTopUpMessage({
                driverName: driver?.full_name || "Driver",
                driverId: driver?.id || "unknown",
                phone: driver?.phone || "",
                amount: amount || 0,
                currency: country.currency,
                countryName: country.name,
                countryCode: country.code,
              });
              return (
                <>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-white px-3 py-2 font-mono text-[11px] text-black">
                    {msg}
                  </pre>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={walletTopUpWhatsAppHref(BRAND.phoneWhatsApp, msg)}
                      target="_blank"
                      rel="noreferrer"
                      className={`ru-btn !min-h-10 !bg-[#25D366] !px-4 !text-xs !text-white ${
                        amount <= 0 ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      WhatsApp top-up
                    </a>
                    <a
                      href={BRAND_TEL_HREF}
                      className="ru-btn ru-btn-secondary !min-h-10 !px-4 !text-xs"
                    >
                      Call ops
                    </a>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </section>

      <section className="ru-card mt-4 p-4">
        <p className="ru-section-label">Weekly incentive</p>
        <p className="mt-1 text-sm font-bold text-black">
          Complete {target} trips this week → get R100 bonus
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ru-elevated)]">
          <div
            className="h-full rounded-full bg-black transition-all"
            style={{ width: `${bonusProgress * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--ru-muted)]">
          {weekTrips}/{target} trips · {Math.max(0, target - weekTrips)} to go
        </p>
        <button
          type="button"
          disabled={pending || weekTrips < target}
          onClick={tryClaimBonus}
          className="ru-btn ru-btn-primary ru-btn-block mt-3 !min-h-10 !text-xs"
        >
          {weekTrips < target ? "Keep going" : pending ? "Claiming…" : "Claim R100"}
        </button>
        {bonusMsg ? (
          <p className="mt-2 text-xs font-medium text-[var(--ru-muted)]">
            {bonusMsg}
          </p>
        ) : null}
      </section>

      <section className="ru-card mt-4 p-4">
        <div
          className="ru-segment"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {(
            [
              ["today", "Today"],
              ["week", "This week"],
              ["month", "This month"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              aria-selected={period === key}
              className="!text-xs"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-black">
          You keep ~{formatMoney(periodStats.keep)} · Gross{" "}
          {formatMoney(periodStats.gross)} · Trips {periodStats.trips} · Avg{" "}
          {formatMoney(periodStats.avg)}/trip
        </p>
        <p className="mt-1 text-xs text-[var(--ru-muted)]">
          Platform commission ~{formatMoney(periodStats.commission)} (from
          wallet)
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-black">
          Recent activity
        </h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ru-muted)]">
            Complete trips to see cash received and ~10% wallet deductions here.
          </p>
        ) : (
          <ul className="ru-list mt-3">
            {transactions.map((tx) => (
              <li key={tx.id} className="ru-row justify-between gap-3 !min-h-0 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black">{tx.label}</p>
                  <p className="text-xs text-[var(--ru-muted)]">
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
                      ? "shrink-0 text-sm font-bold text-black"
                      : "shrink-0 text-sm font-bold text-[var(--ru-muted)]"
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
    </PageShell>
  );
}
