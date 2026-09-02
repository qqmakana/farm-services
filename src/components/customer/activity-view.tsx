"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Clock, RotateCw } from "lucide-react";
import { listJobsByCustomerPhone, cancelRiderJobAction } from "@/lib/actions";
import { listShopOrdersByPhone } from "@/lib/actions-shop-orders";
import { ShopOrderTrack } from "@/components/shops/shop-order-track";
import { formatMoney, formatPhoneDisplay, SERVICE_LABELS } from "@/lib/format";
import { CANCEL_FEE_ZAR, cancelFeeApplies } from "@/lib/ops-policy";
import { ActivityRowSkeleton } from "@/components/ui/skeleton";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getGuestProfile,
  setGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";
import type { JobStatus, JobWithDriver, ServiceType, ShopOrder } from "@/lib/types";
import { TripReceipt } from "@/components/customer/trip-receipt";
import {
  UBER_BTN_BLACK,
  UBER_GLOSS,
  UBER_H1,
  UBER_INPUT,
  UBER_PAGE,
} from "@/components/customer/uber-chrome";

const UPCOMING: JobStatus[] = [
  "new",
  "searching_driver",
  "assigned",
  "confirmed",
  "in_progress",
];

function formatTripWhen(iso: string | null, createdAt: string): string {
  const d = new Date(iso || createdAt);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Today at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYest =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYest) return `Yesterday at ${time}`;
  return d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPastWhen(iso: string | null, createdAt: string): string {
  const d = new Date(iso || createdAt);
  const day = d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} • ${time}`;
}

function formatFareCents(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: currency || "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return formatMoney(amount, currency);
  }
}

function rebookHref(job: JobWithDriver): string {
  const base =
    job.service_type === "delivery"
      ? "/delivery"
      : job.service_type === "courier"
        ? "/courier"
        : job.service_type === "farm"
          ? "/farm"
          : "/ride";
  const params = new URLSearchParams();
  if (job.pickup_landmark) params.set("from", job.pickup_landmark);
  if (job.pickup_lat != null) params.set("fromLat", String(job.pickup_lat));
  if (job.pickup_lng != null) params.set("fromLng", String(job.pickup_lng));
  if (job.dropoff_landmark) params.set("to", job.dropoff_landmark);
  if (job.dropoff_lat != null) params.set("toLat", String(job.dropoff_lat));
  if (job.dropoff_lng != null) params.set("toLng", String(job.dropoff_lng));
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

function thumbFor(service: ServiceType) {
  if (service === "delivery" || service === "courier") return "/home/sug-courier.jpg";
  if (service === "farm") return "/home/sug-farm.jpg";
  return "/home/sug-ride.jpg";
}

export function ActivityView() {
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [receiptJob, setReceiptJob] = useState<JobWithDriver | null>(null);

  const loadTrips = useCallback((phone: string) => {
    startTransition(async () => {
      setError(null);
      try {
        const [rows, shopRows] = await Promise.all([
          listJobsByCustomerPhone(phone),
          listShopOrdersByPhone(phone),
        ]);
        setJobs(rows);
        setShopOrders(shopRows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load trips");
        setJobs([]);
        setShopOrders([]);
      }
    });
  }, []);

  useEffect(() => {
    const p = getGuestProfile();
    setProfile(p);
    if (p?.phone) loadTrips(p.phone);
  }, [loadTrips]);

  function savePhone(e: React.FormEvent) {
    e.preventDefault();
    const phone = phoneInput.replace(/\D/g, "");
    if (!phone) {
      setError("Phone number is required.");
      return;
    }
    setGuestProfile({ name: nameInput.trim(), phone });
    setProfile(getGuestProfile());
    loadTrips(phone);
  }

  const upcoming = useMemo(
    () => jobs.filter((j) => UPCOMING.includes(j.status)),
    [jobs],
  );
  const past = useMemo(
    () =>
      jobs.filter(
        (j) => j.status === "completed" || j.status === "cancelled",
      ),
    [jobs],
  );

  if (!profile?.phone) {
    return (
      <main className={UBER_PAGE}>
        <h1 className={UBER_H1}>Activity</h1>
        <EmptyState
          icon={Clock}
          title="No trips yet"
          body="Your trip history will appear here"
          action={
            <form onSubmit={savePhone} className="space-y-3 text-left">
              <p className="text-center text-[14px] text-[#666666]">
                Enter your phone to see trips.
              </p>
              <input
                className={UBER_INPUT}
                placeholder="082 123 4567"
                aria-label="Phone number"
                inputMode="tel"
                autoComplete="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(formatPhoneDisplay(e.target.value))}
              />
              <input
                className={UBER_INPUT}
                placeholder="Name (optional)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              {error ? (
                <p className="text-[12px] font-normal text-[#CB4040]">{error}</p>
              ) : null}
              <button type="submit" disabled={pending} className={UBER_BTN_BLACK}>
                {pending ? <ButtonSpinner /> : "View activity"}
              </button>
            </form>
          }
        />
      </main>
    );
  }

  return (
    <main
      data-testid="activity-view"
      className={UBER_PAGE}
    >
      <h1 className={UBER_H1}>Activity</h1>

      {shopOrders.length > 0 ? (
        <section className="mt-6 space-y-4">
          <h2 className="text-[17px] font-bold text-[#111111]">Shop orders</h2>
          {shopOrders.map((order) => (
            <ShopOrderTrack key={order.id} order={order} />
          ))}
        </section>
      ) : null}

      {upcoming.length === 0 && past.length === 0 && shopOrders.length === 0 && !pending ? (
        <EmptyState
          icon={Clock}
          title="No trips yet"
          body="Your trip history will appear here"
        />
      ) : (
        <>
      <section className="mt-6">
        <h2 className="text-[17px] font-bold text-[#111111]">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-[14px] text-[#666666]">No upcoming trips</p>
        ) : (
          <ul className="vr-overscroll vr-stagger mt-3 space-y-4">
            {upcoming.map((job) => (
              <TripRow
                key={job.id}
                job={job}
                pending={pending}
                onCancel={
                  profile &&
                  ["new", "searching_driver", "assigned", "confirmed"].includes(
                    job.status,
                  )
                    ? () => {
                        const fee = cancelFeeApplies({
                          createdAt: job.created_at,
                          status: job.status,
                          villagePass: Boolean(job.village_pass),
                        });
                        const card =
                          job.payment_method === "card" ||
                          job.payment_method === "paypal";
                        const ok = window.confirm(
                          fee
                            ? `Cancel after 2 min: ${formatMoney(CANCEL_FEE_ZAR)} goes to the driver.${card ? " Card remainder refunded in Yoco (2–7 days)." : ""} Continue?`
                            : `Cancel within 2 min: full refund.${card ? " Card refunds take 2–7 days via Yoco." : ""} Continue?`,
                        );
                        if (!ok) return;
                        startTransition(async () => {
                          try {
                            await cancelRiderJobAction({
                              jobId: job.id,
                              customerPhone: profile.phone,
                            });
                            setJobs((prev) =>
                              prev.map((j) =>
                                j.id === job.id
                                  ? { ...j, status: "cancelled" }
                                  : j,
                              ),
                            );
                          } catch (e) {
                            setError(
                              e instanceof Error
                                ? e.message
                                : "Could not cancel",
                            );
                          }
                        });
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[17px] font-bold text-[#111111]">Past</h2>
        {error ? (
          <p className="mt-3 text-[12px] text-[#CB4040]">{error}</p>
        ) : null}
        {pending && jobs.length === 0 ? (
          <div className="vr-overscroll mt-4 space-y-3" aria-busy="true">
            <ActivityRowSkeleton />
            <ActivityRowSkeleton />
          </div>
        ) : past.length === 0 ? (
          <p className="mt-3 text-[14px] text-[#666666]">No past trips yet</p>
        ) : (
          <ul className="vr-overscroll vr-stagger mt-3 space-y-4">
            {past.map((job) => (
              <PastTripCard
                key={job.id}
                job={job}
                onReceipt={
                  job.status === "completed"
                    ? () => setReceiptJob(job)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </section>
        </>
      )}

      {receiptJob ? (
        <TripReceipt job={receiptJob} onClose={() => setReceiptJob(null)} />
      ) : null}
    </main>
  );
}

function MapThumb() {
  return (
    <div
      className="relative h-[4.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-[#e5e1d4]"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 88 72"
        preserveAspectRatio="none"
      >
        <path
          d="M8 58 Q28 20 48 36 T82 18"
          stroke="#3b82f6"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="12" cy="56" r="5" fill="#111" />
        <circle cx="78" cy="18" r="5" fill="#111" />
      </svg>
    </div>
  );
}

function PastTripCard({
  job,
  onReceipt,
}: {
  job: JobWithDriver;
  onReceipt?: () => void;
}) {
  const title = job.dropoff_landmark || job.pickup_landmark || "Trip";
  const fare = formatFareCents(
    Number(job.fee_amount),
    job.fee_currency || "ZAR",
  );
  const statusLabel =
    job.status === "cancelled" ? "Cancelled" : "Completed";

  return (
    <li className={`rounded-[28px] p-4 ${UBER_GLOSS}`}>
      <Link
        href={`/trip/${job.reference_code}`}
        className="uber-press flex items-start gap-3 active:opacity-80"
      >
        <MapThumb />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-[#0a0a0a]">
            {title}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-[#71717a]">
            {formatPastWhen(job.scheduled_for, job.created_at)}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-[#71717a]">
            {fare} • {statusLabel}
          </span>
        </span>
      </Link>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={rebookHref(job)}
          className="uber-press inline-flex min-h-10 items-center gap-1.5 rounded-[9999px] bg-[#efefef] px-4 text-sm font-bold text-[#0a0a0a]"
        >
          <RotateCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Rebook
        </Link>
        {onReceipt ? (
          <button
            type="button"
            onClick={onReceipt}
            className="uber-press inline-flex min-h-10 items-center rounded-[9999px] bg-[#efefef] px-4 text-sm font-bold text-[#0a0a0a]"
          >
            Receipt
          </button>
        ) : null}
      </div>
    </li>
  );
}

function TripRow({
  job,
  pending,
  onCancel,
  onReceipt,
  showRebook,
}: {
  job: JobWithDriver;
  pending: boolean;
  onCancel?: () => void;
  onReceipt?: () => void;
  showRebook?: boolean;
}) {
  return (
    <li className="border-b border-gray-100 py-3 last:border-b-0">
      <Link
        href={`/trip/${job.reference_code}`}
        className="uber-press flex items-center gap-3 active:opacity-80"
      >
        <span className="relative h-12 w-[4.25rem] shrink-0 overflow-hidden">
          <Image
            src={thumbFor(job.service_type)}
            alt=""
            fill
            className="object-contain object-left"
            sizes="68px"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-[#0a0a0a]">
            {job.dropoff_landmark || job.pickup_landmark}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-[#71717a]">
            {formatTripWhen(job.scheduled_for, job.created_at)}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-[#71717a]">
            {SERVICE_LABELS[job.service_type]}
            {job.status === "completed"
              ? " · Completed"
              : job.status === "cancelled"
                ? " · Cancelled"
                : ""}
          </span>
        </span>
        <span
          data-testid="trip-fare"
          className="shrink-0 self-start pt-0.5 text-sm font-bold text-[#0a0a0a]"
        >
          {formatMoney(Number(job.fee_amount), job.fee_currency || "ZAR")}
        </span>
      </Link>
      {(showRebook || onReceipt || onCancel) && (
        <div className="mt-2.5 flex flex-wrap gap-2 pl-[5rem]">
          {showRebook ? (
            <Link
              href={rebookHref(job)}
              className="uber-press rounded-full bg-gray-100 px-3.5 py-2 text-xs font-bold text-black hover:bg-gray-200"
            >
              Rebook
            </Link>
          ) : null}
          {onReceipt ? (
            <button
              type="button"
              onClick={onReceipt}
              className="uber-press rounded-full bg-gray-100 px-3.5 py-2 text-xs font-bold text-black hover:bg-gray-200"
            >
              Receipt
            </button>
          ) : null}
          {onCancel ? (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="uber-press rounded-full bg-gray-100 px-3.5 py-2 text-xs font-bold text-black hover:bg-gray-200"
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </li>
  );
}
