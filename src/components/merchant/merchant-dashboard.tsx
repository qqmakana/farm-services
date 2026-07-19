"use client";

import Link from "next/link";
import {
  formatMoney,
  formatWhen,
  SERVICE_LABELS,
  STATUS_LABELS,
  statusBadgeClass,
} from "@/lib/format";
import type { JobWithDriver, Shop } from "@/lib/types";

export function MerchantDashboard({
  shop,
  jobs,
  email,
}: {
  shop: Shop | null;
  jobs: JobWithDriver[];
  email: string | null;
}) {
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

  if (!shop) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Merchant dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as {email ?? "merchant"}, but no shop is linked yet.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white transition active:scale-95"
        >
          Register your shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Business
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
            Manage catalog
          </Link>
          <Link
            href="/delivery"
            className="rounded-xl bg-[#1A4D3A] px-4 py-2 text-sm font-bold text-white transition active:scale-95"
          >
            Book delivery
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Open orders" value={String(open)} />
        <Stat label="Completed" value={String(done)} />
        <Stat label="Completed fees" value={formatMoney(revenue)} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">Orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          Deliveries and orders linked to your shop
        </p>

        {jobs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-900">No orders yet</p>
            <p className="mt-1 text-sm text-slate-500">
              When buyers order from your catalog on /shops, deliveries appear
              here.
            </p>
            <Link
              href="/shops"
              className="mt-4 inline-block text-sm font-semibold text-[#1A4D3A] underline"
            >
              View buyer shop page
            </Link>
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
