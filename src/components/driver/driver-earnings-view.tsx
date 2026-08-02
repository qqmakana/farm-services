"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { claimWeeklyTripBonus, listDriverJobs } from "@/lib/actions";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import { PageShell } from "@/components/ui/page-shell";
import { BRAND, BRAND_TEL_HREF, BRAND_WHATSAPP_HREF } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
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
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
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
      const at = j.completed_at || j.created_at;
      rows.push({
        id: `${j.id}-earn`,
        label: `Cash from customer · ${j.reference_code}`,
        amount: fee,
        at,
      });
      rows.push({
        id: `${j.id}-comm`,
        label: `Platform ~15% · ${j.reference_code}`,
        amount: -commission,
        at,
      });
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

  return (
    <PageShell
      title="Earnings"
      subtitle="Customers pay you cash. You keep ~85%; ~15% comes from this prepaid wallet."
    >
      <section className="ru-card p-5">
        <p className="ru-section-label">Commission wallet</p>
        <p
          className={`mt-1 font-[family-name:var(--font-display)] text-4xl font-bold ${
            wallet < 0 ? "text-[var(--ru-error)]" : "text-black"
          }`}
        >
          {formatMoney(wallet)}
        </p>
        {owed > 0 || wallet < 0 ? (
          <p className="mt-2 text-sm font-semibold text-black">
            Top up needed: {formatMoney(owed || Math.abs(Math.min(0, wallet)))}
            . Low wallet can pause new job offers.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--ru-muted)]">
            Wallet healthy — you can accept rides, deliveries &amp; farm jobs.
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowTopUp((v) => !v)}
          className="ru-btn ru-btn-primary ru-btn-block mt-4"
        >
          Top up wallet
        </button>

        {showTopUp ? (
          <div className="mt-3 space-y-3 rounded-[var(--ru-radius)] border border-[var(--ru-line)] bg-[var(--ru-elevated)] px-4 py-3 text-sm text-[var(--ru-ink)]">
            <p className="font-semibold text-black">How to top up</p>
            <ol className="list-inside list-decimal space-y-1 text-[var(--ru-muted)]">
              <li>
                Send eWallet / Send-iMali / EFT to{" "}
                <strong className="text-black">{BRAND.phone}</strong>
              </li>
              <li>Use your name + phone as the payment reference</li>
              <li>WhatsApp proof of payment — ops will credit your wallet</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <a
                href={`${BRAND_WHATSAPP_HREF}?text=${encodeURIComponent(
                  `Hi — wallet top-up proof for driver ${driver?.full_name ?? ""} ${driver?.phone ?? ""}`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="ru-btn !min-h-10 !bg-[#25D366] !px-4 !text-xs !text-white"
              >
                WhatsApp proof
              </a>
              <a
                href={BRAND_TEL_HREF}
                className="ru-btn ru-btn-secondary !min-h-10 !px-4 !text-xs"
              >
                Call ops
              </a>
            </div>
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
            Complete trips to see cash received and ~15% wallet deductions here.
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
