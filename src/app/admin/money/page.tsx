import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { formatMoney } from "@/lib/format";
import { requireAdminAccess } from "@/lib/admin-auth";
import { listMoneyLedgerAction } from "@/lib/actions-ops";

export const dynamic = "force-dynamic";

export default async function AdminMoneyPage() {
  const gate = await requireAdminAccess();
  if (!gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link
            href="/login?next=/admin/money"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  const rows = await listMoneyLedgerAction();
  const csv = [
    "Date,Code,Rider Paid,Driver Paid,Shop Paid,Village Ride Kept,Yoco Fee,Payment,Status",
    ...rows.map((r) =>
      [
        r.date,
        r.code,
        r.riderPaid,
        r.driverPaid,
        r.shopPaid,
        r.villageKept,
        r.yocoFee,
        r.payment,
        r.status,
      ].join(","),
    ),
  ].join("\n");

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-20">
        <p className="text-[13px] font-semibold text-[#666666]">Ops</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111111]">Money ledger</h1>
        <p className="mt-2 text-sm text-[#666666]">
          Export weekly for SARS. Yoco fee is an estimate (2.95%). Card refunds:
          Yoco dashboard → the payment → Refund. Keep a separate business bank
          account within 3 months of launch.
        </p>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="village-ride-ledger.csv"
          className="uber-press uber-btn-black mt-4 inline-flex no-underline"
        >
          Download CSV
        </a>
        <div className="mt-6 overflow-x-auto rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#EEEEEE] text-[#666666]">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Rider paid</th>
                <th className="px-3 py-2">Driver paid</th>
                <th className="px-3 py-2">Shop paid</th>
                <th className="px-3 py-2">Village kept</th>
                <th className="px-3 py-2">Yoco fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code + r.date} className="border-b border-[#EEEEEE]">
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.code}</td>
                  <td className="px-3 py-2">{formatMoney(r.riderPaid)}</td>
                  <td className="px-3 py-2">{formatMoney(r.driverPaid)}</td>
                  <td className="px-3 py-2">{formatMoney(r.shopPaid)}</td>
                  <td className="px-3 py-2">{formatMoney(r.villageKept)}</td>
                  <td className="px-3 py-2">{formatMoney(r.yocoFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
