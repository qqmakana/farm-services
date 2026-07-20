import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { formatMoney } from "@/lib/format";
import {
  adminIssueRefundNote,
  getAdminDashboardData,
} from "@/lib/actions-ops";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  if (!data.gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with an allowlisted admin email ({data.gate.reason ?? "denied"}).
          </p>
          <Link
            href="/login?next=/admin/dashboard"
            className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  const s = data.stats!;

  async function refundAction(formData: FormData) {
    "use server";
    const jobId = String(formData.get("jobId") || "");
    const note = String(formData.get("note") || "");
    if (jobId && note) await adminIssueRefundNote(jobId, note);
  }

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Ops
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">{data.gate.email}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin/errors" className="rounded-lg border px-3 py-1.5 font-semibold">
              Errors
            </Link>
            <Link href="/admin/analytics" className="rounded-lg border px-3 py-1.5 font-semibold">
              Analytics
            </Link>
            <Link href="/admin/monitoring" className="rounded-lg border px-3 py-1.5 font-semibold">
              Monitoring
            </Link>
            <Link href="/admin/verifications" className="rounded-lg border px-3 py-1.5 font-semibold">
              Verifications
            </Link>
            <Link href="/dispatch" className="rounded-lg border px-3 py-1.5 font-semibold">
              Dispatch
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Merchants"
            value={`${s.merchantsActive ?? s.merchants}/${s.merchants}`}
            hint="active / total"
          />
          <Stat
            label="Drivers"
            value={`${s.onlineDrivers}/${s.drivers}`}
            hint="online / total"
          />
          <Stat
            label="Orders open"
            value={String((s.ordersPending ?? 0) + (s.ordersInProgress ?? 0))}
            hint={`${s.ordersPending ?? 0} pending · ${s.ordersInProgress ?? 0} in progress`}
          />
          <Stat
            label="Completed"
            value={String(s.ordersCompleted ?? s.orders)}
            hint={`${s.orders} total`}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Revenue today" value={formatMoney(s.revenueToday)} />
          <Stat label="Revenue week" value={formatMoney(s.revenueWeek)} />
          <Stat label="Revenue month" value={formatMoney(s.revenueMonth)} />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold">Recent activity</h2>
          <ul className="mt-3 space-y-2">
            {data.activity.length === 0 ? (
              <li className="text-sm text-slate-500">No recent activity yet.</li>
            ) : (
              data.activity.map((line) => (
                <li
                  key={line}
                  className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                >
                  {line}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold">Quick lists</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold">Recent orders</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {(data.jobs as { reference_code?: string; status?: string }[])
                  .slice(0, 8)
                  .map((j, i) => (
                    <li key={j.reference_code ?? i}>
                      {j.reference_code} · {j.status}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold">Issue refund note</h3>
              <p className="mt-1 text-xs text-slate-500">
                Logs a REFUND note on the job for ops follow-up (cash model —
                no card capture reverse here).
              </p>
              <form action={refundAction} className="mt-3 space-y-2">
                <input
                  name="jobId"
                  required
                  placeholder="Job UUID"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="note"
                  required
                  placeholder="Refund reason / amount"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#1A4D3A] px-4 py-2 text-sm font-bold text-white"
                >
                  Save refund note
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1A4D3A]">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}
