import { sendPushToToken } from "@/lib/firebase/admin";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  Job,
  PartnerNotification,
  PartnerWeeklyReport,
  Shop,
} from "@/lib/types";

/** Exact formula from product spec. */
export function generateReferralCode(businessName: string): string {
  const base = (businessName || "SHOP").slice(0, 4).toUpperCase();
  return base + Math.random().toString(36).slice(2, 5);
}

export function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Monday–Sunday window for the week containing `at`. */
export function weekBounds(at = new Date()): {
  weekStart: string;
  weekEnd: string;
  weekKey: string;
} {
  const d = new Date(at);
  const day = d.getDay(); // 0 Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return {
    weekStart: mon.toISOString().slice(0, 10),
    weekEnd: sun.toISOString().slice(0, 10),
    weekKey: isoWeekKey(mon),
  };
}

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

export type PartnerNotifyInput = {
  shopId: string;
  userId?: string | null;
  type: PartnerNotification["type"];
  title: string;
  body: string;
  emailBody?: string | null;
  jobId?: string | null;
  reportId?: string | null;
};

/** Persist in-app notification + optional FCM + optional free webhook email. */
export async function notifyPartner(
  input: PartnerNotifyInput,
): Promise<PartnerNotification | null> {
  const row: PartnerNotification = {
    id: `n-${Math.random().toString(36).slice(2, 10)}`,
    shop_id: input.shopId,
    user_id: input.userId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    email_body: input.emailBody ?? null,
    job_id: input.jobId ?? null,
    report_id: input.reportId ?? null,
    read_at: null,
    created_at: new Date().toISOString(),
  };

  if (!useAdmin()) {
    const { mockPartnerStore } = await import("./partner-mock");
    return mockPartnerStore.addNotification(row);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_partner_notifications")
    .insert({
      shop_id: input.shopId,
      user_id: input.userId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      email_body: input.emailBody ?? null,
      job_id: input.jobId ?? null,
      report_id: input.reportId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[partner:notify]", error.message);
    return null;
  }

  // Push via existing FCM (merchant profile token)
  let fcm: string | null = null;
  if (input.userId) {
    const { data: profile } = await admin
      .from("rr_profiles")
      .select("fcm_token")
      .eq("id", input.userId)
      .maybeSingle();
    fcm = profile?.fcm_token ?? null;
  }
  if (!fcm) {
    const { data: shop } = await admin
      .from("rr_shops")
      .select("user_id")
      .eq("id", input.shopId)
      .maybeSingle();
    if (shop?.user_id) {
      const { data: profile } = await admin
        .from("rr_profiles")
        .select("fcm_token")
        .eq("id", shop.user_id)
        .maybeSingle();
      fcm = profile?.fcm_token ?? null;
    }
  }

  await sendPushToToken(fcm, {
    title: input.title,
    body: input.body,
    data: {
      url: "/merchant/dashboard",
      type: input.type,
    },
  });

  await deliverPartnerEmailOptional({
    shopId: input.shopId,
    subject: input.title,
    text: input.emailBody || input.body,
  });

  return data as PartnerNotification;
}

/** Free-tier email: optional webhook only (no paid ESP). Always have in-app. */
async function deliverPartnerEmailOptional(params: {
  shopId: string;
  subject: string;
  text: string;
}) {
  const webhook = process.env.PARTNER_EMAIL_WEBHOOK?.trim();
  if (!webhook) return;

  let to: string | null = null;
  try {
    if (useAdmin()) {
      const admin = createAdminClient();
      const { data: shop } = await admin
        .from("rr_shops")
        .select("user_id")
        .eq("id", params.shopId)
        .maybeSingle();
      if (shop?.user_id) {
        const { data: user } = await admin.auth.admin.getUserById(shop.user_id);
        to = user.user?.email ?? null;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject: params.subject,
        text: params.text,
        shopId: params.shopId,
        source: "village-ride-partner",
      }),
    });
    if (to) {
      try {
        const admin = createAdminClient();
        await admin.from("rr_email_logs").insert({
          to_email: to.slice(0, 320),
          subject: params.subject.slice(0, 500),
          template: "partner_notify",
          via: res.ok ? "webhook" : "webhook_failed",
        });
      } catch {
        /* optional audit */
      }
    }
  } catch (err) {
    console.error("[partner:email-webhook]", err);
  }
}

export async function notifyPartnerForJob(
  job: Pick<Job, "id" | "shop_id" | "reference_code" | "status" | "customer_name">,
  kind: "order_created" | "driver_assigned" | "order_completed",
  extra?: string,
) {
  if (!job.shop_id) return;

  const titles = {
    order_created: "New delivery created",
    driver_assigned: "Driver accepted your order",
    order_completed: "Delivery completed",
  } as const;

  const bodies = {
    order_created: `Order ${job.reference_code} for ${job.customer_name} is searching for a driver.`,
    driver_assigned: `A driver accepted ${job.reference_code}. Track live on your dashboard.`,
    order_completed: `${job.reference_code} was completed.${extra ? ` ${extra}` : ""}`,
  } as const;

  let userId: string | null = null;
  if (useAdmin()) {
    const admin = createAdminClient();
    const { data: shop } = await admin
      .from("rr_shops")
      .select("user_id")
      .eq("id", job.shop_id)
      .maybeSingle();
    userId = shop?.user_id ?? null;
  }

  await notifyPartner({
    shopId: job.shop_id,
    userId,
    type: kind,
    title: titles[kind],
    body: bodies[kind],
    emailBody: `${titles[kind]}\n\n${bodies[kind]}\n\nOpen: /merchant/dashboard`,
    jobId: job.id,
  });
}

export function buildWeeklySummaryText(params: {
  shopName: string;
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  ordersTotal: number;
  ordersCompleted: number;
  ordersCancelled: number;
  revenueTotal: number;
  commissionTotal: number;
  referralSignups: number;
}): string {
  return [
    `Village Ride weekly report — ${params.shopName}`,
    `Week ${params.weekKey} (${params.weekStart} → ${params.weekEnd})`,
    "",
    `Orders: ${params.ordersTotal} total · ${params.ordersCompleted} completed · ${params.ordersCancelled} cancelled`,
    `Delivery fees: R${params.revenueTotal.toFixed(0)}`,
    `Platform commission (driver wallet): R${params.commissionTotal.toFixed(0)}`,
    `Partners who joined with your code: ${params.referralSignups}`,
    "",
    "This report was generated automatically. View details in your merchant dashboard.",
    "No meeting required — create deliveries anytime from /merchant/dashboard.",
  ].join("\n");
}

export type WeeklyReportResult = {
  shopId: string;
  report: PartnerWeeklyReport | null;
  created: boolean;
};

/** Generate (or refresh) weekly report for one shop. */
export async function generateShopWeeklyReport(
  shop: Shop,
  at = new Date(),
): Promise<WeeklyReportResult> {
  const { weekStart, weekEnd, weekKey } = weekBounds(at);
  const startIso = `${weekStart}T00:00:00.000Z`;
  const endIso = `${weekEnd}T23:59:59.999Z`;

  if (!useAdmin()) {
    const { mockPartnerStore } = await import("./partner-mock");
    const { mockRepo } = await import("./mock-store");
    const startIso = `${weekStart}T00:00:00.000Z`;
    const endIso = `${weekEnd}T23:59:59.999Z`;
    const list = mockRepo
      .listJobs()
      .filter(
        (j) =>
          j.shop_id === shop.id &&
          j.created_at >= startIso &&
          j.created_at <= endIso,
      );
    const ordersTotal = list.length;
    const ordersCompleted = list.filter((j) => j.status === "completed").length;
    const ordersCancelled = list.filter((j) => j.status === "cancelled").length;
    const revenueTotal = list
      .filter((j) => j.status === "completed")
      .reduce((s, j) => s + Number(j.fee_amount || 0), 0);
    const commissionTotal = list
      .filter((j) => j.status === "completed")
      .reduce((s, j) => {
        const fee = Number(j.fee_amount || 0);
        const c = Number(j.platform_commission || 0);
        return s + (c > 0 ? c : Math.round((fee * 15) / 100));
      }, 0);
    const referralSignups = mockRepo
      .listShops()
      .filter(
        (s) =>
          s.referred_by_shop_id === shop.id &&
          s.created_at >= startIso &&
          s.created_at <= endIso,
      ).length;

    const report = mockPartnerStore.upsertWeekly({
      shop,
      weekStart,
      weekEnd,
      weekKey,
      ordersTotal,
      ordersCompleted,
      ordersCancelled,
      revenueTotal,
      commissionTotal,
      referralSignups,
    });
    return { shopId: shop.id, report, created: true };
  }

  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("rr_jobs")
    .select("status, fee_amount, platform_commission, created_at")
    .eq("shop_id", shop.id)
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  const list = jobs ?? [];
  const ordersTotal = list.length;
  const ordersCompleted = list.filter((j) => j.status === "completed").length;
  const ordersCancelled = list.filter((j) => j.status === "cancelled").length;
  const revenueTotal = list
    .filter((j) => j.status === "completed")
    .reduce((s, j) => s + Number(j.fee_amount || 0), 0);
  const commissionTotal = list
    .filter((j) => j.status === "completed")
    .reduce((s, j) => {
      const fee = Number(j.fee_amount || 0);
      const c = Number(j.platform_commission || 0);
      return s + (c > 0 ? c : Math.round((fee * 15) / 100));
    }, 0);

  const { count: referralSignups } = await admin
    .from("rr_shops")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_shop_id", shop.id)
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  const summary = buildWeeklySummaryText({
    shopName: shop.name,
    weekKey,
    weekStart,
    weekEnd,
    ordersTotal,
    ordersCompleted,
    ordersCancelled,
    revenueTotal,
    commissionTotal,
    referralSignups: referralSignups ?? 0,
  });

  const payload = {
    shop_id: shop.id,
    week_start: weekStart,
    week_end: weekEnd,
    week_key: weekKey,
    orders_total: ordersTotal,
    orders_completed: ordersCompleted,
    orders_cancelled: ordersCancelled,
    revenue_total: revenueTotal,
    platform_commission_total: commissionTotal,
    referral_signups: referralSignups ?? 0,
    summary_text: summary,
  };

  const { data: existing } = await admin
    .from("rr_partner_weekly_reports")
    .select("id")
    .eq("shop_id", shop.id)
    .eq("week_key", weekKey)
    .maybeSingle();

  let report: PartnerWeeklyReport | null = null;
  let created = false;

  if (existing?.id) {
    const { data } = await admin
      .from("rr_partner_weekly_reports")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    report = data as PartnerWeeklyReport;
  } else {
    const { data, error } = await admin
      .from("rr_partner_weekly_reports")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      console.error("[partner:weekly]", error.message);
      return { shopId: shop.id, report: null, created: false };
    }
    report = data as PartnerWeeklyReport;
    created = true;
  }

  if (report && created) {
    await notifyPartner({
      shopId: shop.id,
      userId: shop.user_id,
      type: "weekly_report",
      title: `Weekly report ${weekKey}`,
      body: `${ordersCompleted} completed · R${revenueTotal.toFixed(0)} fees · ${referralSignups ?? 0} referrals`,
      emailBody: summary,
      reportId: report.id,
    });

    try {
      const { weeklyReportEmail, sendViaPartnerWebhook } = await import(
        "./email-templates"
      );
      let to: string | null = null;
      if (shop.user_id) {
        const { data: user } = await admin.auth.admin.getUserById(shop.user_id);
        to = user.user?.email ?? null;
      }
      if (to) {
        const site =
          process.env.NEXT_PUBLIC_SITE_URL ?? "https://village-ride.vercel.app";
        const tpl = weeklyReportEmail({
          shopName: shop.name,
          weekKey,
          summaryText: summary,
          dashboardUrl: `${site}/merchant/dashboard`,
        });
        await sendViaPartnerWebhook({
          to,
          template: tpl,
          templateKey: "weekly_report",
        });
      }
    } catch {
      /* optional */
    }

    await admin
      .from("rr_partner_weekly_reports")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", report.id);
  }

  return { shopId: shop.id, report, created };
}

export async function generateAllPartnerWeeklyReports(at = new Date()) {
  if (!useAdmin()) {
    const { mockRepo } = await import("./mock-store");
    const results: WeeklyReportResult[] = [];
    for (const shop of mockRepo.listShops()) {
      results.push(await generateShopWeeklyReport(shop, at));
    }
    return results;
  }

  const admin = createAdminClient();
  const { data: shops } = await admin
    .from("rr_shops")
    .select("*")
    .eq("is_active", true)
    .not("user_id", "is", null);

  const results: WeeklyReportResult[] = [];
  for (const shop of shops ?? []) {
    results.push(await generateShopWeeklyReport(shop as Shop, at));
  }
  return results;
}
