"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/admin-auth";
import { trackEvent, trackPageView, getAnalyticsSummary } from "@/lib/analytics";
import { logAppError, listErrorLogs, markErrorFixed } from "@/lib/error-log";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockRepo } from "@/lib/mock-store";
import { sendPushToToken } from "@/lib/firebase/admin";

function useAdminDb() {
  return isSupabaseConfigured() && hasServiceRole();
}

export async function reportClientError(input: {
  message: string;
  stack?: string | null;
  context?: string | null;
  url?: string | null;
  severity?: "info" | "warning" | "error" | "critical";
}) {
  let userId: string | null = null;
  try {
    if (useAdminDb()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }
  } catch {
    /* ignore */
  }
  await logAppError({ ...input, userId });
}

export async function trackClientPageView(input: {
  page: string;
  referrer?: string | null;
  userAgent?: string | null;
}) {
  let userId: string | null = null;
  try {
    if (useAdminDb()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }
  } catch {
    /* ignore */
  }
  await trackPageView({ ...input, userId });
}

export async function trackClientEvent(
  event: string,
  data?: Record<string, unknown>,
) {
  let userId: string | null = null;
  try {
    if (useAdminDb()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }
  } catch {
    /* ignore */
  }
  await trackEvent(event, data, userId);
}

export async function getPlatformTrustStats() {
  if (!useAdminDb()) {
    const jobs = mockRepo.listJobs();
    const drivers = mockRepo.listDrivers();
    const completed = jobs.filter((j) => j.status === "completed").length;
    const verified = drivers.filter(
      (d) =>
        d.verification_status === "verified" ||
        (d.id_verified && !d.verification_status),
    ).length;
    const ratings = drivers.filter((d) => (d.rating_count ?? 0) > 0);
    const avg =
      ratings.length === 0
        ? 4.8
        : ratings.reduce((s, d) => s + Number(d.rating_avg || 0), 0) /
          ratings.length;
    return {
      deliveriesCompleted: Math.max(completed, jobs.length > 0 ? completed : 12),
      verifiedDrivers: Math.max(verified, 1),
      avgRating: Math.round(avg * 10) / 10,
      activeShops: mockRepo.listShops().length,
    };
  }

  const admin = createAdminClient();
  const [
    { count: deliveriesCompleted },
    { count: verifiedDrivers },
    { data: ratingRows },
    { count: activeShops },
  ] = await Promise.all([
    admin
      .from("rr_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    admin
      .from("rr_drivers")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    admin
      .from("rr_drivers")
      .select("rating_avg, rating_count")
      .gt("rating_count", 0)
      .limit(200),
    admin
      .from("rr_shops")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const rated = ratingRows ?? [];
  const avgRating =
    rated.length === 0
      ? 4.8
      : Math.round(
          (rated.reduce((s, d) => s + Number(d.rating_avg || 0), 0) /
            rated.length) *
            10,
        ) / 10;

  return {
    deliveriesCompleted: deliveriesCompleted ?? 0,
    verifiedDrivers: verifiedDrivers ?? 0,
    avgRating,
    activeShops: activeShops ?? 0,
  };
}

export async function getAdminDashboardData() {
  const gate = await requireAdminAccess();
  if (!gate.ok) return { gate, stats: null, activity: [] as string[] };

  if (!useAdminDb()) {
    const jobs = mockRepo.listJobs();
    const drivers = mockRepo.listDrivers();
    const shops = mockRepo.listShops();
    const completed = jobs.filter((j) => j.status === "completed");
    const revenue = completed.reduce((s, j) => s + Number(j.fee_amount || 0), 0);
    const activity = [
      ...shops.slice(0, 3).map((s) => `Merchant ${s.name} is active`),
      ...drivers
        .filter((d) => d.is_online)
        .slice(0, 3)
        .map((d) => `Driver ${d.full_name} is online`),
      ...completed
        .slice(0, 3)
        .map((j) => `Order ${j.reference_code} completed`),
    ];
    return {
      gate,
      stats: {
        merchants: shops.length,
        merchantsActive: shops.filter((s) => s.is_active !== false).length,
        drivers: drivers.length,
        onlineDrivers: drivers.filter((d) => d.is_online).length,
        orders: jobs.length,
        ordersPending: jobs.filter(
          (j) =>
            j.status === "new" ||
            j.status === "searching_driver" ||
            j.status === "confirmed" ||
            j.status === "assigned",
        ).length,
        ordersInProgress: jobs.filter((j) => j.status === "in_progress").length,
        ordersCompleted: completed.length,
        revenueToday: revenue,
        revenueWeek: revenue,
        revenueMonth: revenue,
      },
      activity,
      jobs: jobs.slice(0, 20),
      shops,
      drivers: drivers.slice(0, 20),
    };
  }

  const admin = createAdminClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  const [
    { count: merchants },
    { count: merchantsActive },
    { count: drivers },
    { count: orders },
    { count: ordersPending },
    { count: ordersInProgress },
    { count: ordersCompleted },
    { data: completedToday },
    { data: completedWeek },
    { data: completedMonth },
    { count: onlineDrivers },
    { data: recentJobs },
    { data: recentShops },
    { data: recentDrivers },
  ] = await Promise.all([
    admin.from("rr_shops").select("id", { count: "exact", head: true }),
    admin
      .from("rr_shops")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    admin.from("rr_drivers").select("id", { count: "exact", head: true }),
    admin.from("rr_jobs").select("id", { count: "exact", head: true }),
    admin
      .from("rr_jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "searching_driver", "confirmed", "assigned"]),
    admin
      .from("rr_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    admin
      .from("rr_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    admin
      .from("rr_jobs")
      .select("fee_amount")
      .eq("status", "completed")
      .gte("completed_at", startOfDay.toISOString()),
    admin
      .from("rr_jobs")
      .select("fee_amount")
      .eq("status", "completed")
      .gte("completed_at", weekAgo.toISOString()),
    admin
      .from("rr_jobs")
      .select("fee_amount")
      .eq("status", "completed")
      .gte("completed_at", monthAgo.toISOString()),
    admin
      .from("rr_drivers")
      .select("id", { count: "exact", head: true })
      .eq("is_online", true),
    admin
      .from("rr_jobs")
      .select("reference_code, status, customer_name, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("rr_shops")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("rr_drivers")
      .select("full_name, is_online, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const sum = (rows: { fee_amount?: number }[] | null) =>
    (rows ?? []).reduce((s, j) => s + Number(j.fee_amount || 0), 0);

  const activity: string[] = [
    ...(recentShops ?? []).map((s) => `Merchant ${s.name} signed up`),
    ...(recentDrivers ?? [])
      .filter((d) => d.is_online)
      .map((d) => `Driver ${d.full_name} went online`),
    ...(recentJobs ?? [])
      .filter((j) => j.status === "completed")
      .map((j) => `Order ${j.reference_code} completed`),
  ].slice(0, 20);

  return {
    gate,
    stats: {
      merchants: merchants ?? 0,
      merchantsActive: merchantsActive ?? 0,
      drivers: drivers ?? 0,
      onlineDrivers: onlineDrivers ?? 0,
      orders: orders ?? 0,
      ordersPending: ordersPending ?? 0,
      ordersInProgress: ordersInProgress ?? 0,
      ordersCompleted: ordersCompleted ?? 0,
      revenueToday: sum(completedToday),
      revenueWeek: sum(completedWeek),
      revenueMonth: sum(completedMonth),
    },
    activity,
    jobs: recentJobs ?? [],
    shops: recentShops ?? [],
    drivers: recentDrivers ?? [],
  };
}

export async function getAdminErrorsData() {
  const gate = await requireAdminAccess();
  if (!gate.ok) return { gate, errors: [] as Awaited<ReturnType<typeof listErrorLogs>> };
  const errors = await listErrorLogs(80);
  return { gate, errors };
}

export async function adminMarkErrorFixed(id: string) {
  const gate = await requireAdminAccess();
  if (!gate.ok) throw new Error("Admin access required");
  await markErrorFixed(id, gate.email ?? "admin");
  revalidatePath("/admin/errors");
}

export async function getAdminAnalyticsData() {
  const gate = await requireAdminAccess();
  if (!gate.ok) return { gate, summary: null, ops: null };

  const summary = await getAnalyticsSummary();

  if (!useAdminDb()) {
    const jobs = mockRepo.listJobs();
    const drivers = mockRepo.listDrivers();
    return {
      gate,
      summary,
      ops: {
        ordersToday: jobs.filter(
          (j) => j.created_at >= new Date(Date.now() - 86400000).toISOString(),
        ).length,
        referralEvents: storeReferralCount(),
        onlineDrivers: drivers.filter((d) => d.is_online).length,
        popularRoutes: topRoutes(jobs),
      },
    };
  }

  const admin = createAdminClient();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const [{ count: ordersToday }, { count: referralEvents }, { count: online }, { data: jobs }] =
    await Promise.all([
      admin
        .from("rr_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayAgo),
      admin
        .from("rr_analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event", "referral_used"),
      admin
        .from("rr_drivers")
        .select("id", { count: "exact", head: true })
        .eq("is_online", true),
      admin
        .from("rr_jobs")
        .select("pickup_landmark, dropoff_landmark")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  return {
    gate,
    summary,
    ops: {
      ordersToday: ordersToday ?? 0,
      referralEvents: referralEvents ?? 0,
      onlineDrivers: online ?? 0,
      popularRoutes: topRoutes(jobs ?? []),
    },
  };
}

function storeReferralCount() {
  return 0;
}

function topRoutes(
  jobs: { pickup_landmark?: string; dropoff_landmark?: string }[],
) {
  const map = new Map<string, number>();
  for (const j of jobs) {
    const key = `${j.pickup_landmark ?? "?"} → ${j.dropoff_landmark ?? "?"}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([route, count]) => ({ route, count }));
}

export async function getAdminMonitoringData() {
  const gate = await requireAdminAccess();
  if (!gate.ok) return { gate, health: null };

  const started = Date.now();
  let dbOk = false;
  let dbMs = 0;
  if (useAdminDb()) {
    const t0 = Date.now();
    try {
      const admin = createAdminClient();
      await admin.from("rr_profiles").select("id").limit(1);
      dbOk = true;
      dbMs = Date.now() - t0;
    } catch {
      dbOk = false;
      dbMs = Date.now() - t0;
    }
  } else {
    dbOk = true;
    dbMs = 1;
  }

  const errors = await listErrorLogs(20);
  const last24 = errors.filter((e) => {
    const created = String((e as { created_at?: string }).created_at ?? "");
    return created >= new Date(Date.now() - 86400000).toISOString();
  });

  return {
    gate,
    health: {
      apiOk: true,
      apiMs: Date.now() - started,
      dbOk,
      dbMs,
      mockMode: !useAdminDb(),
      errorsLast24: last24.length,
      criticalUnfixed: last24.filter(
        (e) =>
          (e as { severity?: string; fixed?: boolean }).severity === "critical" &&
          !(e as { fixed?: boolean }).fixed,
      ).length,
      fcmConfigured: Boolean(
        process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY,
      ),
      recentErrors: last24.slice(0, 10),
    },
  };
}

export type CancelReason =
  | "customer_changed_mind"
  | "wrong_items"
  | "no_drivers"
  | "other";

export async function cancelMerchantOrder(
  jobId: string,
  reason: CancelReason,
  note?: string,
) {
  const reasonLabel: Record<CancelReason, string> = {
    customer_changed_mind: "Customer changed mind",
    wrong_items: "Wrong items",
    no_drivers: "No drivers available",
    other: note?.trim() || "Other",
  };

  if (!useAdminDb()) {
    const job = mockRepo.updateStatus(jobId, "cancelled");
    (job as { cancel_reason?: string }).cancel_reason = reasonLabel[reason];
    await trackEvent("order_cancelled", { jobId, reason });
    revalidatePath("/merchant/dashboard");
    return job;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("rr_profiles")
    .select("shop_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: job } = await admin
    .from("rr_jobs")
    .select("*, drivers:rr_drivers!driver_id(*)")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) throw new Error("Order not found");

  if (profile?.role === "merchant") {
    const { data: shop } = await admin
      .from("rr_shops")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (job.shop_id !== shop?.id && job.shop_id !== profile.shop_id) {
      throw new Error("Not your order");
    }
  } else if (profile?.role !== "admin" && profile?.role !== "dispatcher") {
    throw new Error("Not allowed");
  }

  if (job.status === "completed" || job.status === "cancelled") {
    throw new Error("Order cannot be cancelled");
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("rr_jobs")
    .update({
      status: "cancelled",
      cancel_reason: reasonLabel[reason],
      cancelled_by: user.id,
      cancelled_at: now,
    })
    .eq("id", jobId)
    .select("*, drivers:rr_drivers!driver_id(*)")
    .single();
  if (error) throw new Error(error.message);

  const driver = (updated as { drivers?: { fcm_token?: string | null } | null })
    .drivers;
  if (driver?.fcm_token) {
    await sendPushToToken(driver.fcm_token, {
      title: "Order cancelled",
      body: `${updated.reference_code} was cancelled by the merchant.`,
      data: { url: "/driver/jobs", type: "order_cancelled" },
    });
  }

  await trackEvent("order_cancelled", {
    jobId,
    reason,
    code: updated.reference_code,
  });
  revalidatePath("/merchant/dashboard");
  revalidatePath("/dispatch");
  return updated;
}

export async function submitDriverJoinApplication(input: {
  full_name: string;
  email?: string;
  phone: string;
  vehicle_type: "sedan" | "bakkie" | "truck";
  area?: string;
}) {
  if (!input.full_name.trim() || !input.phone.trim()) {
    throw new Error("Name and phone are required.");
  }

  const row = {
    full_name: input.full_name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone.trim(),
    vehicle_type: input.vehicle_type,
    area: input.area?.trim() || null,
    status: "pending",
  };

  if (!useAdminDb()) {
    await trackEvent("driver_application", row as Record<string, unknown>);
    return { id: `app-${Date.now()}`, ...row };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_driver_applications")
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await trackEvent("driver_application", { id: data.id });
  return data;
}

export async function adminIssueRefundNote(
  jobId: string,
  note: string,
) {
  const gate = await requireAdminAccess();
  if (!gate.ok) throw new Error("Admin access required");
  if (!useAdminDb()) {
    await logAppError({
      message: `Refund note for ${jobId}: ${note}`,
      context: "admin_refund",
      severity: "info",
    });
    return { ok: true };
  }
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("rr_jobs")
    .select("reference_code, dispatcher_notes")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) throw new Error("Job not found");
  const notes = [job.dispatcher_notes, `REFUND: ${note.trim()}`]
    .filter(Boolean)
    .join(" · ");
  await admin.from("rr_jobs").update({ dispatcher_notes: notes }).eq("id", jobId);
  await trackEvent("refund_noted", { jobId, note });
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function getMerchantReferralDashboard() {
  // Lightweight: reuse merchant shop + referred shops
  const { getMerchantDashboardData } = await import("@/lib/actions");
  const dash = await getMerchantDashboardData();
  if (!dash?.shop) return null;

  const bonusPer = 50;
  let referred: Array<{
    id: string;
    name: string;
    created_at: string;
    status: string;
  }> = [];

  if (!useAdminDb()) {
    referred = mockRepo
      .listShops()
      .filter((s) => s.referred_by_shop_id === dash.shop!.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        created_at: s.created_at,
        status: "active",
      }));
  } else {
    const admin = createAdminClient();
    const { data } = await admin
      .from("rr_shops")
      .select("id, name, created_at, is_active")
      .eq("referred_by_shop_id", dash.shop.id)
      .order("created_at", { ascending: false });
    referred = (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      created_at: s.created_at,
      status: s.is_active ? "active" : "pending",
    }));
  }

  const converted = referred.filter((r) => r.status === "active").length;
  return {
    shop: dash.shop,
    email: dash.email,
    referred,
    stats: {
      sent: referred.length,
      converted,
      bonusEarned: converted * bonusPer,
      pendingBonus: Math.max(0, (referred.length - converted) * bonusPer),
    },
    leaderboard: await getReferralLeaderboard(),
  };
}

async function getReferralLeaderboard() {
  if (!useAdminDb()) {
    const shops = mockRepo.listShops();
    return shops
      .map((s) => ({
        name: s.name,
        count: shops.filter((x) => x.referred_by_shop_id === s.id).length,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  const admin = createAdminClient();
  const { data: shops } = await admin
    .from("rr_shops")
    .select("id, name, referred_by_shop_id");
  const list = shops ?? [];
  return list
    .map((s) => ({
      name: s.name,
      count: list.filter((x) => x.referred_by_shop_id === s.id).length,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
