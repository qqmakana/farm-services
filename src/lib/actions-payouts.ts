"use server";

import { requireAdminAccess } from "@/lib/admin-auth";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { shopNetPayable } from "@/lib/shop-constants";
import { isCardPaymentMethod } from "@/lib/wallet";

export type DriverPayoutRow = {
  id: string;
  driver_id: string;
  driver_name: string | null;
  week_starting: string;
  week_ending: string;
  job_count: number;
  amount: number;
  status: "pending" | "paid";
  paid_at: string | null;
  payment_reference: string | null;
};

export type ShopSettlementRow = {
  id: string;
  shop_id: string;
  shop_name: string | null;
  week_starting: string;
  week_ending: string;
  total_sales: number;
  commission_amount: number;
  net_payable: number;
  status: "pending" | "paid";
  paid_at: string | null;
  payment_reference: string | null;
};

function mondayOf(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

function sundayOf(monday: Date) {
  const x = new Date(monday);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function generateWeeklyPayoutsAction() {
  const gate = await requireAdminAccess();
  if (!gate.ok) throw new Error("Admin only.");
  if (!hasServiceRole()) throw new Error("Supabase service role required.");

  const admin = createAdminClient();
  const start = mondayOf();
  const end = sundayOf(start);
  const week_starting = isoDate(start);
  const week_ending = isoDate(end);

  const { data: jobs, error: jobErr } = await admin
    .from("rr_jobs")
    .select("id, driver_id, driver_payout, payment_method, completed_at, status")
    .eq("status", "completed")
    .gte("completed_at", start.toISOString())
    .lte("completed_at", end.toISOString());
  if (jobErr) throw new Error(jobErr.message);

  const byDriver = new Map<string, { count: number; amount: number }>();
  for (const job of jobs ?? []) {
    if (!job.driver_id || !isCardPaymentMethod(job.payment_method)) continue;
    const amt = Math.max(0, Math.round(Number(job.driver_payout) || 0));
    if (!amt) continue;
    const cur = byDriver.get(job.driver_id) ?? { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += amt;
    byDriver.set(job.driver_id, cur);
  }

  const driverIds = [...byDriver.keys()];
  const { data: wallets } = driverIds.length
    ? await admin
        .from("rr_drivers")
        .select("id, wallet_balance, commission_owed")
        .in("id", driverIds)
    : { data: [] as { id: string; wallet_balance: number; commission_owed: number }[] };
  const debtById = new Map(
    (wallets ?? []).map((d) => {
      const owed = Math.max(
        0,
        Math.round(Number(d.commission_owed) || 0),
        Math.round(-Math.min(0, Number(d.wallet_balance) || 0)),
      );
      return [d.id, owed] as const;
    }),
  );

  for (const [driver_id, cur] of byDriver) {
    const debt = debtById.get(driver_id) ?? 0;
    await admin.from("rr_driver_payouts").upsert(
      {
        driver_id,
        week_starting,
        week_ending,
        job_count: cur.count,
        amount: Math.max(0, cur.amount - debt),
        status: "pending",
      },
      { onConflict: "driver_id,week_starting" },
    );
  }

  const { data: orders, error: orderErr } = await admin
    .from("rr_shop_orders")
    .select("shop_id, subtotal, status, created_at")
    .neq("status", "cancelled")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());
  if (orderErr) throw new Error(orderErr.message);

  const byShop = new Map<string, number>();
  for (const order of orders ?? []) {
    if (!order.shop_id) continue;
    byShop.set(
      order.shop_id,
      (byShop.get(order.shop_id) ?? 0) + Math.round(Number(order.subtotal) || 0),
    );
  }

  for (const [shop_id, sales] of byShop) {
    const split = shopNetPayable(sales);
    await admin.from("rr_shop_settlements").upsert(
      {
        shop_id,
        week_starting,
        week_ending,
        total_sales: split.sales,
        commission_amount: split.commission,
        net_payable: split.net,
        status: "pending",
      },
      { onConflict: "shop_id,week_starting" },
    );
  }

  return { week_starting, week_ending, drivers: byDriver.size, shops: byShop.size };
}

export async function listPayoutBoardsAction(): Promise<{
  drivers: DriverPayoutRow[];
  shops: ShopSettlementRow[];
}> {
  const gate = await requireAdminAccess();
  if (!gate.ok) return { drivers: [], shops: [] };
  if (!hasServiceRole()) return { drivers: [], shops: [] };

  const admin = createAdminClient();
  const { data: drivers } = await admin
    .from("rr_driver_payouts")
    .select("*, rr_drivers(full_name)")
    .order("week_ending", { ascending: false })
    .limit(80);
  const { data: shops } = await admin
    .from("rr_shop_settlements")
    .select("*, rr_shops(name)")
    .order("week_ending", { ascending: false })
    .limit(80);

  return {
    drivers: (drivers ?? []).map((row) => ({
      id: row.id,
      driver_id: row.driver_id,
      driver_name:
        (row.rr_drivers as { full_name?: string } | null)?.full_name ?? null,
      week_starting: row.week_starting,
      week_ending: row.week_ending,
      job_count: row.job_count,
      amount: row.amount,
      status: row.status,
      paid_at: row.paid_at,
      payment_reference: row.payment_reference,
    })),
    shops: (shops ?? []).map((row) => ({
      id: row.id,
      shop_id: row.shop_id,
      shop_name: (row.rr_shops as { name?: string } | null)?.name ?? null,
      week_starting: row.week_starting,
      week_ending: row.week_ending,
      total_sales: row.total_sales,
      commission_amount: row.commission_amount,
      net_payable: row.net_payable,
      status: row.status,
      paid_at: row.paid_at,
      payment_reference: row.payment_reference,
    })),
  };
}

export async function markDriverPayoutPaidAction(
  id: string,
  reference: string,
) {
  const gate = await requireAdminAccess();
  if (!gate.ok) throw new Error("Admin only.");
  const admin = createAdminClient();
  const { error } = await admin
    .from("rr_driver_payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_reference: reference.trim() || "EFT",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markShopSettlementPaidAction(
  id: string,
  reference: string,
) {
  const gate = await requireAdminAccess();
  if (!gate.ok) throw new Error("Admin only.");
  const admin = createAdminClient();
  const { error } = await admin
    .from("rr_shop_settlements")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_reference: reference.trim() || "EFT",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
