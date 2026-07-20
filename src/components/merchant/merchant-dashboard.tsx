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
import { isSearchingStatus } from "@/lib/job-status";
import {
  defaultLaterLocal,
  localInputToIso,
  ScheduleWhen,
  type WhenMode,
} from "@/components/uber/schedule-when";
import type {
  JobWithDriver,
  PartnerNotification,
  PartnerWeeklyReport,
  Shop,
} from "@/lib/types";

const CHECKLIST_KEY = "vr_partner_checklist_dismissed";

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
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
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
  const pendingOrders = jobs.filter(
    (j) =>
      isSearchingStatus(j.status) ||
      j.status === "confirmed" ||
      j.status === "assigned" ||
      j.status === "in_progress",
  ).length;
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

  const checklist = useMemo(() => {
    const firstDelivery = jobs.length > 0;
    const sharedReferral = referralCount > 0;
    const sawReport = reports.length > 0;
    return [
      { id: "account", label: "Business account linked", done: true },
      {
        id: "delivery",
        label: "Create your first delivery",
        done: firstDelivery,
      },
      {
        id: "referral",
        label: "Share your referral link",
        done: sharedReferral,
      },
      {
        id: "report",
        label: "Check your weekly report",
        done: sawReport,
      },
    ];
  }, [jobs.length, referralCount, reports.length]);

  const checklistComplete = checklist.every((c) => c.done);
  const showChecklist = !checklistDismissed && !checklistComplete;

  useEffect(() => {
    try {
      setChecklistDismissed(localStorage.getItem(CHECKLIST_KEY) === "1");
    } catch {
      setChecklistDismissed(false);
    }
  }, []);

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

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://village-ride.vercel.app";
  const shareUrl = `${origin}/shop?ref=${shop.referral_code ?? ""}`;

  function tripUrl(code: string) {
    return `${origin}/trip/${code}`;
  }

  async function copyTripLink(code: string) {
    try {
      await navigator.clipboard.writeText(tripUrl(code));
      setMessage("Trip link copied — share with your customer.");
    } catch {
      setError("Could not copy link. Open Track and share from there.");
    }
  }

  function submitDelivery(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const scheduled_for =
      whenMode === "later" ? localInputToIso(scheduledLocal) : null;
    if (whenMode === "later" && !scheduled_for) {
      setError("Pick a valid date and time for the scheduled delivery.");
      return;
    }
    startTransition(async () => {
      try {
        const job = await createMerchantDelivery({
          ...delivery,
          scheduled_for,
        });
        setMessage(
          whenMode === "later"
            ? `Scheduled ${job.reference_code} — we'll notify drivers nearer the time.`
            : `Order ${job.reference_code} created — drivers notified.`,
        );
        setDelivery({
          customer_name: "",
          customer_phone: "",
          dropoff_landmark: "",
          item_description: "",
          size: "medium",
        });
        setWhenMode("now");
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

  function dismissChecklist() {
    setChecklistDismissed(true);
    try {
      localStorage.setItem(CHECKLIST_KEY, "1");
    } catch {
      /* ignore */
    }
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

      {showChecklist && (
        <section className="mt-6 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Get started in 4 steps
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Your first delivery is a tap away — no meeting required.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissChecklist}
              className="text-xs font-semibold text-slate-500 underline"
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {checklist.map((step) => (
              <li
                key={step.id}
                className="flex items-center gap-2 text-sm text-slate-800"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done
                      ? "bg-[#1A4D3A] text-white"
                      : "border border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {step.done ? "✓" : "·"}
                </span>
                <span className={step.done ? "text-slate-500 line-through" : ""}>
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
          {!checklist.find((c) => c.id === "delivery")?.done ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 w-full rounded-xl bg-[#1A4D3A] px-4 py-3 text-sm font-bold text-white transition active:scale-95"
            >
              Create your first delivery
            </button>
          ) : null}
        </section>
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
          <ScheduleWhen
            mode={whenMode}
            onModeChange={setWhenMode}
            scheduledLocal={scheduledLocal}
            onScheduledLocalChange={setScheduledLocal}
            nowLabel="Deliver now"
          />
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
            {pending
              ? "Creating…"
              : whenMode === "later"
                ? "Schedule delivery"
                : "Create & notify drivers"}
          </button>
        </form>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total deliveries" value={String(jobs.length)} />
        <Stat label="Pending" value={String(pendingOrders)} />
        <Stat label="Completed" value={String(done)} />
        <Stat label="Fees earned*" value={formatMoney(revenue)} />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        *Delivery fees on completed orders. Platform commission (~15% /{" "}
        {formatMoney(commissionShown)}) is auto-deducted from the{" "}
        <strong>driver</strong> wallet — not charged to your shop. Open: {open}.
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
          Auto-generated summaries. Open a report to email yourself with mailto.
        </p>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No reports yet — tap Generate, or wait for the Monday cron.
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
          <div className="mt-6 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-8 text-center">
            <p className="text-lg font-bold text-slate-900">
              Your first delivery is a tap away
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Create a delivery from your shop — online drivers get a push
              notification instantly.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white transition active:scale-95"
            >
              Create delivery
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {jobs.map((job) => {
              const exhausted =
                Boolean(job.dispatch_exhausted) &&
                isSearchingStatus(job.status);
              const driver = job.drivers;
              return (
                <li
                  key={job.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  {exhausted ? (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                      <p className="font-semibold">No drivers available right now</p>
                      <p className="mt-0.5">
                        We&apos;ll keep looking. You can also schedule for later
                        when more drivers are online.
                      </p>
                      <button
                        type="button"
                        className="mt-2 font-semibold text-[#1A4D3A] underline"
                        onClick={() => {
                          setWhenMode("later");
                          setShowForm(true);
                        }}
                      >
                        Schedule another delivery
                      </button>
                    </div>
                  ) : null}
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
                        {job.scheduled_for ? " (scheduled)" : ""}
                      </p>
                      {job.product_summary ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {job.product_summary}
                        </p>
                      ) : null}
                      {driver ? (
                        <p className="mt-2 text-xs font-medium text-slate-700">
                          Driver: {driver.full_name}
                          {Number(driver.rating_avg) > 0
                            ? ` · ★ ${Number(driver.rating_avg).toFixed(1)} (${driver.rating_count ?? 0})`
                            : " · New driver"}
                        </p>
                      ) : isSearchingStatus(job.status) && !exhausted ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Searching for a driver…
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
                      <div className="mt-2 flex flex-col items-end gap-1">
                        <Link
                          href={`/trip/${job.reference_code}`}
                          className="text-xs font-semibold text-[#1A4D3A] underline"
                        >
                          Track
                        </Link>
                        <button
                          type="button"
                          onClick={() => void copyTripLink(job.reference_code)}
                          className="text-xs font-semibold text-slate-600 underline"
                        >
                          Share trip link
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
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
