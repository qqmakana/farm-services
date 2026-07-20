"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createMerchantDelivery,
  generateMyWeeklyReport,
  markPartnerNotificationsRead,
  saveMerchantFcmToken,
} from "@/lib/actions";
import {
  formatMoney,
  formatWhen,
  SERVICE_LABELS,
  STATUS_LABELS,
  statusBadgeClass,
} from "@/lib/format";
import { requestFcmToken } from "@/lib/firebase/client";
import type {
  JobWithDriver,
  PartnerNotification,
  PartnerWeeklyReport,
  Shop,
} from "@/lib/types";

export function MerchantDashboard({
  shop,
  jobs,
  email,
  notifications,
  reports,
  referralCount,
}: {
  shop: Shop | null;
  jobs: JobWithDriver[];
  email: string | null;
  notifications: PartnerNotification[];
  reports: PartnerWeeklyReport[];
  referralCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [delivery, setDelivery] = useState({
    customer_name: "",
    customer_phone: "",
    dropoff_landmark: "",
    item_description: "",
    size: "medium" as "small" | "medium" | "large" | "xl",
  });

  const open = jobs.filter(
    (j) =>
      j.status === "new" ||
      j.status === "searching_driver" ||
      j.status === "confirmed" ||
      j.status === "assigned" ||
      j.status === "in_progress",
  ).length;
  const done = jobs.filter((j) => j.status === "completed").length;
  const revenue = jobs
    .filter((j) => j.status === "completed")
    .reduce((s, j) => s + Number(j.fee_amount || 0), 0);
  const commissionShown = jobs
    .filter((j) => j.status === "completed")
    .reduce((s, j) => {
      const fee = Number(j.fee_amount || 0);
      const c = Number(j.platform_commission || 0);
      return s + (c > 0 ? c : Math.round((fee * 15) / 100));
    }, 0);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read_at),
    [notifications],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await requestFcmToken();
        if (!cancelled && token) await saveMerchantFcmToken(token);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!shop) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Partner dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as {email ?? "merchant"}, but no shop is linked yet.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white transition active:scale-95"
        >
          Register your business
        </Link>
      </main>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/shop?ref=${shop.referral_code ?? ""}`
      : `/shop?ref=${shop.referral_code ?? ""}`;

  function submitDelivery(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const job = await createMerchantDelivery(delivery);
        setMessage(`Order ${job.reference_code} created — drivers notified.`);
        setDelivery({
          customer_name: "",
          customer_phone: "",
          dropoff_landmark: "",
          item_description: "",
          size: "medium",
        });
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function markAllRead() {
    if (!unread.length) return;
    startTransition(async () => {
      await markPartnerNotificationsRead(unread.map((n) => n.id));
      router.refresh();
    });
  }

  function runWeekly() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateMyWeeklyReport();
        setMessage(
          result.report
            ? `Weekly report ${result.report.week_key} ready in your inbox.`
            : "Report generation finished.",
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Partner
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{shop.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {shop.category} · {shop.landmark}
            {email ? ` · ${email}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/shop"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition active:scale-95"
          >
            Catalog
          </Link>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-[#1A4D3A] px-4 py-2 text-sm font-bold text-white transition active:scale-95"
          >
            {showForm ? "Close" : "Create delivery"}
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={submitDelivery}
          className="mt-6 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"
        >
          <h2 className="text-base font-bold text-slate-900">
            New delivery from your shop
          </h2>
          <p className="text-xs text-slate-600">
            Pickup is fixed at <strong>{shop.name}</strong>. Drivers get an FCM
            push automatically. Commission is deducted from the driver wallet
            when complete.
          </p>
          <input
            required
            placeholder="Customer name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            value={delivery.customer_name}
            onChange={(e) =>
              setDelivery({ ...delivery, customer_name: e.target.value })
            }
          />
          <input
            required
            placeholder="Customer phone"
            inputMode="tel"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            value={delivery.customer_phone}
            onChange={(e) =>
              setDelivery({ ...delivery, customer_phone: e.target.value })
            }
          />
          <input
            required
            placeholder="Drop-off landmark / address"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            value={delivery.dropoff_landmark}
            onChange={(e) =>
              setDelivery({ ...delivery, dropoff_landmark: e.target.value })
            }
          />
          <input
            required
            placeholder="What to deliver"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            value={delivery.item_description}
            onChange={(e) =>
              setDelivery({ ...delivery, item_description: e.target.value })
            }
          />
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            value={delivery.size}
            onChange={(e) =>
              setDelivery({
                ...delivery,
                size: e.target.value as typeof delivery.size,
              })
            }
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">XL / fridge / furniture</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#1A4D3A] px-4 py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create & notify drivers"}
          </button>
        </form>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open" value={String(open)} />
        <Stat label="Completed" value={String(done)} />
        <Stat label="Fees" value={formatMoney(revenue)} />
        <Stat label="Commission*" value={formatMoney(commissionShown)} />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        *Platform commission (~15%) is auto-deducted from the driver wallet on
        completion — not charged to your shop.
      </p>

      <section className="mt-8 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Your referral code</h2>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-[#1A4D3A]">
          {shop.referral_code ?? "—"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {referralCount} partner{referralCount === 1 ? "" : "s"} signed up with
          your code. Share the link below — no meetings needed.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              void navigator.clipboard?.writeText(shop.referral_code ?? "");
              setMessage("Referral code copied.");
            }}
          >
            Copy code
          </button>
          <a
            href={`mailto:?subject=Join Village Ride&body=Register as a partner with my code ${shop.referral_code}: ${shareUrl}`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            Email invite
          </a>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            Notifications
            {unread.length > 0 ? (
              <span className="ml-2 rounded-full bg-[#1A4D3A] px-2 py-0.5 text-xs font-bold text-white">
                {unread.length}
              </span>
            ) : null}
          </h2>
          {unread.length > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-[#1A4D3A] underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Order updates and weekly reports appear here (and via FCM push).
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.slice(0, 12).map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  n.read_at
                    ? "border-gray-100 bg-white text-slate-600"
                    : "border-emerald-100 bg-emerald-50/60 text-slate-900"
                }`}
              >
                <p className="font-semibold">{n.title}</p>
                <p className="mt-0.5 text-xs">{n.body}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {formatWhen(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Weekly reports</h2>
          <button
            type="button"
            disabled={pending}
            onClick={runWeekly}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
          >
            Generate this week
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Auto-generated summaries (also emailed via free webhook if configured).
          Open a report to email yourself with mailto.
        </p>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No reports yet — tap Generate, or wait for the Sunday cron.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold">{r.week_key}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.week_start} → {r.week_end}
                    </p>
                  </div>
                  <a
                    href={`mailto:${email ?? ""}?subject=Village Ride ${r.week_key}&body=${encodeURIComponent(r.summary_text)}`}
                    className="text-xs font-semibold text-[#1A4D3A] underline"
                  >
                    Email me
                  </a>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {r.orders_completed}/{r.orders_total} completed ·{" "}
                  {formatMoney(Number(r.revenue_total))} fees ·{" "}
                  {r.referral_signups} referrals
                </p>
                <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600">
                  {r.summary_text}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">Orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          Live list of deliveries linked to your shop
        </p>

        {jobs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-900">No orders yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create a delivery above, or wait for buyers on /shops.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">
                      {job.reference_code}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {job.customer_name} · {job.customer_phone}
                    </p>
                    <p className="mt-1 text-sm text-slate-800">
                      {job.pickup_landmark} → {job.dropoff_landmark}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {SERVICE_LABELS[job.service_type]} ·{" "}
                      {formatWhen(job.scheduled_for || job.created_at)}
                    </p>
                    {job.product_summary ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {job.product_summary}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-900">
                      {formatMoney(Number(job.fee_amount))}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(job.status)}`}
                    >
                      {STATUS_LABELS[job.status]}
                    </span>
                    <div className="mt-2">
                      <Link
                        href={`/trip/${job.reference_code}`}
                        className="text-xs font-semibold text-[#1A4D3A] underline"
                      >
                        Track
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1A4D3A]">{value}</p>
    </div>
  );
}
