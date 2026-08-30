import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { formatMoney } from "@/lib/format";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  generateWeeklyPayoutsAction,
  listPayoutBoardsAction,
  markDriverPayoutPaidAction,
  markShopSettlementPaidAction,
} from "@/lib/actions-payouts";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const gate = await requireAdminAccess();
  if (!gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link
            href="/login?next=/admin/payouts"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  const boards = await listPayoutBoardsAction();

  async function generate() {
    "use server";
    await generateWeeklyPayoutsAction();
  }

  async function payDriver(formData: FormData) {
    "use server";
    await markDriverPayoutPaidAction(
      String(formData.get("id") || ""),
      String(formData.get("reference") || ""),
    );
  }

  async function payShop(formData: FormData) {
    "use server";
    await markShopSettlementPaidAction(
      String(formData.get("id") || ""),
      String(formData.get("reference") || ""),
    );
  }

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-20">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Ops
        </p>
        <h1 className="mt-1 text-2xl font-bold">Weekly payouts</h1>
        <p className="mt-2 text-sm text-slate-600">
          Yoco collects all card money into Village Ride. Pay drivers and shops
          by EFT from Capitec, then mark paid here. Trips stay 90/10. Shops:
          85% of goods.
        </p>
        <form action={generate} className="mt-4">
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
          >
            Build this week&apos;s totals
          </button>
        </form>

        <h2 className="mt-8 text-lg font-bold">Drivers</h2>
        <ul className="mt-3 space-y-3">
          {boards.drivers.length === 0 ? (
            <li className="text-sm text-slate-500">No driver rows yet. Run SQL + generate.</li>
          ) : (
            boards.drivers.map((row) => (
              <li key={row.id} className="rounded-2xl border bg-white p-4">
                <p className="font-semibold">
                  {row.driver_name || row.driver_id} · {formatMoney(row.amount)}
                </p>
                <p className="text-xs text-slate-500">
                  {row.week_starting} → {row.week_ending} · {row.job_count} card
                  trips · {row.status}
                </p>
                {row.status === "pending" ? (
                  <form action={payDriver} className="mt-3 flex gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      name="reference"
                      placeholder="Capitec ref"
                      className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-black px-3 py-2 text-sm font-bold text-white"
                    >
                      Mark paid
                    </button>
                  </form>
                ) : (
                  <p className="mt-1 text-xs text-emerald-700">
                    Paid {row.paid_at?.slice(0, 10)} · {row.payment_reference}
                  </p>
                )}
              </li>
            ))
          )}
        </ul>

        <h2 className="mt-8 text-lg font-bold">Shops</h2>
        <ul className="mt-3 space-y-3">
          {boards.shops.length === 0 ? (
            <li className="text-sm text-slate-500">No shop settlements yet.</li>
          ) : (
            boards.shops.map((row) => (
              <li key={row.id} className="rounded-2xl border bg-white p-4">
                <p className="font-semibold">
                  {row.shop_name || row.shop_id} · {formatMoney(row.net_payable)}
                </p>
                <p className="text-xs text-slate-500">
                  Sales {formatMoney(row.total_sales)} · commission{" "}
                  {formatMoney(row.commission_amount)} · {row.status}
                </p>
                {row.status === "pending" ? (
                  <form action={payShop} className="mt-3 flex gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      name="reference"
                      placeholder="Capitec ref"
                      className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-black px-3 py-2 text-sm font-bold text-white"
                    >
                      Mark paid
                    </button>
                  </form>
                ) : (
                  <p className="mt-1 text-xs text-emerald-700">
                    Paid {row.paid_at?.slice(0, 10)} · {row.payment_reference}
                  </p>
                )}
              </li>
            ))
          )}
        </ul>
      </main>
    </>
  );
}
