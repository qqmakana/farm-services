import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BonusPayoutsBoard } from "@/components/admin/bonus-payouts-board";
import { getAdminCityBonusBoard } from "@/lib/actions-founding-bonus";
import { monthYearKey } from "@/lib/founding-driver";

export const dynamic = "force-dynamic";

export default async function AdminBonusPayoutsPage() {
  const data = await getAdminCityBonusBoard();

  if (!data.gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with an allowlisted admin email (
            {data.gate.reason ?? "denied"}).
          </p>
          <Link
            href="/login?next=/admin/bonus-payouts"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Ops
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Founding Driver bonus payouts
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {data.gate.email} · month {data.month_year || monthYearKey()}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Performance bonus program only — not a financial security.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
          >
            Dashboard
          </Link>
        </div>

        <BonusPayoutsBoard
          monthYear={data.month_year}
          initialRows={data.rows}
        />
      </main>
    </>
  );
}
