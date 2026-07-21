"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createMerchantDelivery,
  generateMyWeeklyReport,
  markPartnerNotificationsRead,
  rateTrip,
  saveMerchantFcmToken,
} from "@/lib/actions";
import { cancelMerchantOrder } from "@/lib/actions-ops";
import {
  formatMoney,
  formatWhen,
  STATUS_LABELS,
} from "@/lib/format";
import { requestFcmToken } from "@/lib/firebase/client";
import { isSearchingStatus } from "@/lib/job-status";
import {
  defaultLaterLocal,
  localInputToIso,
  ScheduleWhen,
  type WhenMode,
} from "@/components/uber/schedule-when";
import { DriverVehiclePhotos } from "@/components/driver-vehicle-photos";
import { StatCard } from "@/components/ui/card";
import { FloatingInput } from "@/components/ui/floating-input";
import {
  StatusBadge,
  statusToneFromJob,
} from "@/components/ui/status-badge";
import { useOnlineStatus } from "@/components/offline-banner";
import { MerchantPushPrompt } from "@/components/merchant/merchant-push-prompt";
import { TripShare } from "@/components/trip-share";
import { useToast } from "@/components/ui/toast";
import type {
  JobWithDriver,
  PartnerNotification,
  PartnerWeeklyReport,
  Shop,
} from "@/lib/types";

type Period = "today" | "week" | "month";

function startOfPeriod(period: Period): Date {
  const d = new Date();
  if (period === "today") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "week") {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

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
  const online = useOnlineStatus();
  const { success: toastSuccess } = useToast();
  const [pending, startTransition] = useTransition();
  const [ratedJobs, setRatedJobs] = useState<Record<string, number>>({});
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
  const [period, setPeriod] = useState<Period>("week");

  const periodJobs = useMemo(() => {
    const from = startOfPeriod(period).getTime();
    return jobs.filter((j) => {
      const t = new Date(j.scheduled_for || j.created_at).getTime();
      return t >= from;
    });
  }, [jobs, period]);

  const open = periodJobs.filter(
    (j) =>
      j.status === "new" ||
      j.status === "searching_driver" ||
      j.status === "confirmed" ||
      j.status === "assigned" ||
      j.status === "in_progress",
  ).length;
  const done = periodJobs.filter((j) => j.status === "completed").length;
  const pendingOrders = periodJobs.filter(
    (j) =>
      isSearchingStatus(j.status) ||
      j.status === "confirmed" ||
      j.status === "assigned" ||
      j.status === "in_progress",
  ).length;
  const revenue = periodJobs
    .filter((j) => j.status === "completed")
    .reduce((s, j) => s + Number(j.fee_amount || 0), 0);
  const commissionShown = periodJobs
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
      toastSuccess("Trip link copied");
    } catch {
      setError("Could not copy link. Open Track and share from there.");
    }
  }

  function submitDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!online) {
      setError("You're offline — reconnect to create a delivery.");
      return;
    }
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
    <main className="ru-page-enter mx-auto max-w-3xl px-4 py-8 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
            Partner
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-bold tracking-tight text-black">
            Hello, {shop.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--ru-muted)]">
            {formatMoney(revenue)} this{" "}
            {period === "today" ? "day" : period === "week" ? "week" : "month"}{" "}
            · {shop.landmark}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/merchant/referrals"
            className="ru-btn ru-btn-secondary !min-h-11 !px-4 !text-sm"
          >
            Referrals
          </Link>
          <Link
            href="/shop"
            className="ru-btn ru-btn-secondary !min-h-11 !px-4 !text-sm"
          >
            Catalog
          </Link>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="ru-btn ru-btn-primary !min-h-11 !px-4 !text-sm"
          >
            {showForm ? "Close" : "Create delivery"}
          </button>
          </div>
        </div>

      <MerchantPushPrompt />

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
        <section className="ru-card mt-6 border border-[var(--ru-line)] p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-black">
                Get started in 4 steps
              </h2>
              <p className="mt-1 text-sm text-[var(--ru-muted)]">
                Your first delivery is a tap away — no meeting required.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissChecklist}
              className="ru-btn-ghost text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {checklist.map((step) => (
              <li
                key={step.id}
                className="flex items-center gap-2 text-sm text-black"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done
                      ? "bg-black text-white"
                      : "border border-[var(--ru-line)] bg-white text-[var(--ru-muted)]"
                  }`}
                >
                  {step.done ? "✓" : "·"}
                </span>
                <span
                  className={
                    step.done ? "text-[var(--ru-muted)] line-through" : ""
                  }
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
          {!checklist.find((c) => c.id === "delivery")?.done ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="ru-btn ru-btn-primary ru-btn-block mt-4"
            >
              Create your first delivery
            </button>
          ) : null}
        </section>
      )}

      {showForm && (
        <form
          onSubmit={submitDelivery}
          className="ru-card mt-6 space-y-4 p-5"
        >
          <div>
            <h2 className="text-lg font-bold text-black">Request delivery</h2>
            <p className="mt-1 text-xs text-[var(--ru-muted)]">
              Pickup: <strong className="text-black">{shop.name}</strong>. Drivers
              get a push when you submit.
            </p>
          </div>
          <ScheduleWhen
            mode={whenMode}
            onModeChange={setWhenMode}
            scheduledLocal={scheduledLocal}
            onScheduledLocalChange={setScheduledLocal}
            nowLabel="Deliver now"
          />
          <FloatingInput
            required
            label="Customer name"
            value={delivery.customer_name}
            onChange={(e) =>
              setDelivery({ ...delivery, customer_name: e.target.value })
            }
          />
          <FloatingInput
            required
            label="Customer phone"
            inputMode="tel"
            value={delivery.customer_phone}
            onChange={(e) =>
              setDelivery({ ...delivery, customer_phone: e.target.value })
            }
          />
          <FloatingInput
            required
            label="Where to?"
            placeholder="Drop-off landmark"
            value={delivery.dropoff_landmark}
            onChange={(e) =>
              setDelivery({ ...delivery, dropoff_landmark: e.target.value })
            }
          />
          <FloatingInput
            required
            label="What to deliver"
            value={delivery.item_description}
            onChange={(e) =>
              setDelivery({ ...delivery, item_description: e.target.value })
            }
          />
          <div className="ru-field has-value">
            <label htmlFor="delivery-size">Package size</label>
            <select
              id="delivery-size"
              className="ru-input"
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
          </div>
          <button
            type="submit"
            disabled={pending || !online}
            className="ru-btn ru-btn-primary ru-btn-block"
          >
            {!online
              ? "Offline — reconnect to request"
              : pending
                ? "Creating…"
                : whenMode === "later"
                  ? "Schedule delivery"
                  : "Request delivery"}
          </button>
        </form>
      )}

      <div className="mt-8 flex gap-6 border-b border-[var(--ru-line)]">
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
            className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${
              period === key
                ? "border-black text-black"
                : "border-transparent text-[var(--ru-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Deliveries" value={String(periodJobs.length)} />
        <StatCard label="Pending" value={String(pendingOrders)} />
        <StatCard label="Completed" value={String(done)} />
        <StatCard label="Fees" value={formatMoney(revenue)} />
      </div>
      <p className="mt-2 text-[11px] text-[var(--ru-muted)]">
        Platform commission (~15% / {formatMoney(commissionShown)}) comes from
        the driver wallet — not your shop. Open: {open}.
      </p>

      <section className="ru-card mt-8 p-5">
        <h2 className="text-lg font-bold text-black">Your referral code</h2>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-black">
          {shop.referral_code ?? "—"}
        </p>
        <p className="mt-2 text-sm text-[var(--ru-muted)]">
          {referralCount} partner{referralCount === 1 ? "" : "s"} signed up with
          your code. Share the link below — no meetings needed.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="ru-btn ru-btn-secondary !min-h-10 !px-3 !text-xs"
            onClick={() => {
              void navigator.clipboard?.writeText(shop.referral_code ?? "");
              setMessage("Referral code copied.");
            }}
          >
            Copy code
          </button>
          <a
            href={`mailto:?subject=Join Village Ride&body=Register as a partner with my code ${shop.referral_code}: ${shareUrl}`}
            className="ru-btn ru-btn-secondary !min-h-10 !px-3 !text-xs"
          >
            Email invite
          </a>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-black">
            Notifications
            {unread.length > 0 ? (
              <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">
                {unread.length}
              </span>
            ) : null}
          </h2>
          {unread.length > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-black underline"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ru-muted)]">
            Order updates and weekly reports appear here (and via FCM push).
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.slice(0, 12).map((n) => (
              <li
                key={n.id}
                className={`ru-card flex gap-3 px-3 py-3 text-sm ${
                  n.read_at ? "opacity-70" : ""
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.read_at ? "bg-transparent" : "bg-black"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p
                    className={
                      n.read_at ? "font-medium text-[var(--ru-muted)]" : "font-bold text-black"
                    }
                  >
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--ru-muted)]">{n.body}</p>
                  <p className="mt-1 text-[10px] text-[var(--ru-muted)]">
                    {formatWhen(n.created_at)}
                  </p>
                </div>
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
        <h2 className="text-lg font-bold text-black">Orders</h2>
        <p className="mt-1 text-sm text-[var(--ru-muted)]">
          {period === "today"
            ? "Today"
            : period === "week"
              ? "This week"
              : "This month"}{" "}
          · trip-style history
        </p>

        {periodJobs.length === 0 ? (
          <div className="ru-card mt-6 border border-dashed border-[var(--ru-line)] p-8 text-center">
            <p className="text-lg font-bold text-black">
              No deliveries in this period
            </p>
            <p className="mt-2 text-sm text-[var(--ru-muted)]">
              Create a delivery from your shop — online drivers get a push
              instantly.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="ru-btn ru-btn-primary mt-5 !px-6"
            >
              Create delivery
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {periodJobs.map((job) => {
              const exhausted =
                Boolean(job.dispatch_exhausted) &&
                isSearchingStatus(job.status);
              const driver = job.drivers;
              return (
                <li key={job.id} className="ru-card p-4">
                  {exhausted ? (
                    <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
                      <p className="font-semibold">No drivers available right now</p>
                      <p className="mt-0.5">
                        Schedule for later when more drivers are online.
                      </p>
                      <button
                        type="button"
                        className="mt-2 font-semibold text-black underline"
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
                    <div className="min-w-0 flex-1">
                      {driver ? (
                        <div className="space-y-2">
                          <DriverVehiclePhotos driver={driver} />
                          <p className="text-sm font-semibold text-black">
                            {driver.full_name}
                            <span className="ml-1 font-normal text-[var(--ru-muted)]">
                              {Number(driver.rating_avg) > 0
                                ? `★ ${Number(driver.rating_avg).toFixed(1)}`
                                : "New"}
                            </span>
                            {driver.vehicle_registration ? (
                              <span className="ml-1 font-mono text-xs font-normal text-[var(--ru-muted)]">
                                · {driver.vehicle_registration}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[var(--ru-muted)]">
                          {isSearchingStatus(job.status) && !exhausted
                            ? "Finding driver…"
                            : "Unassigned"}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-black">
                        {job.pickup_landmark}
                        <span className="mx-1 text-[var(--ru-muted)]">→</span>
                        {job.dropoff_landmark}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ru-muted)]">
                        {job.customer_name} · {job.reference_code} ·{" "}
                        {formatWhen(job.scheduled_for || job.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-black">
                        {formatMoney(Number(job.fee_amount))}
                      </p>
                      <div className="mt-1">
                        <StatusBadge tone={statusToneFromJob(job.status)}>
                          {STATUS_LABELS[job.status]}
                        </StatusBadge>
                      </div>
                      <div className="mt-2 flex flex-col items-end gap-1">
                        <Link
                          href={`/trip/${job.reference_code}`}
                          className="text-xs font-semibold text-black underline"
                        >
                          Track
                        </Link>
                        <TripShare
                          referenceCode={job.reference_code}
                          pickup={job.pickup_landmark}
                          dropoff={job.dropoff_landmark}
                        />
                        {job.status === "completed" && job.drivers ? (
                          ratedJobs[job.id] ? (
                            <p className="text-xs text-[var(--ru-muted)]">
                              You rated ★{ratedJobs[job.id]}
                            </p>
                          ) : (
                            <button
                              type="button"
                              disabled={pending}
                              className="text-xs font-semibold text-black underline"
                              onClick={() => {
                                const raw = window.prompt(
                                  "Rate driver 1–5 stars",
                                  "5",
                                );
                                if (!raw) return;
                                const stars = Math.min(
                                  5,
                                  Math.max(1, Number(raw) || 5),
                                );
                                startTransition(async () => {
                                  try {
                                    await rateTrip(job.id, stars);
                                    setRatedJobs((m) => ({
                                      ...m,
                                      [job.id]: stars,
                                    }));
                                    toastSuccess("Thanks for rating the driver");
                                  } catch (err) {
                                    setError(
                                      err instanceof Error
                                        ? err.message
                                        : "Rating failed",
                                    );
                                  }
                                });
                              }}
                            >
                              Rate driver
                            </button>
                          )
                        ) : null}
                        {job.status !== "completed" &&
                        job.status !== "cancelled" ? (
                          <button
                            type="button"
                            disabled={pending}
                            className="text-xs font-semibold text-rose-700 underline"
                            onClick={() => {
                              const reason = window.prompt(
                                "Cancel reason: customer_changed_mind | wrong_items | no_drivers | other",
                                "customer_changed_mind",
                              );
                              if (!reason) return;
                              const allowed = [
                                "customer_changed_mind",
                                "wrong_items",
                                "no_drivers",
                                "other",
                              ] as const;
                              const key = allowed.includes(
                                reason as (typeof allowed)[number],
                              )
                                ? (reason as (typeof allowed)[number])
                                : "other";
                              startTransition(async () => {
                                try {
                                  await cancelMerchantOrder(
                                    job.id,
                                    key,
                                    key === "other" ? reason : undefined,
                                  );
                                  setMessage(`Cancelled ${job.reference_code}`);
                                  router.refresh();
                                } catch (err) {
                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : "Cancel failed",
                                  );
                                }
                              });
                            }}
                          >
                            Cancel order
                          </button>
                        ) : null}
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
