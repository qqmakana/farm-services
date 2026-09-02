import { sendPushToToken } from "@/lib/firebase/admin";
import { formatMoney } from "@/lib/format";
import { distanceKm, etaMinutes } from "@/lib/geo";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  AppNotification,
  Driver,
  Job,
  NotificationAudience,
  ShopOrder,
} from "@/lib/types";

function useDb() {
  return isSupabaseConfigured() && hasServiceRole();
}

export function phoneKey(phone?: string | null): string {
  return String(phone || "").replace(/\D/g, "").slice(-9);
}

export function firstName(name?: string | null, fallback = "Your driver"): string {
  const part = String(name || "")
    .trim()
    .split(/\s+/)[0];
  return part || fallback;
}

function randId() {
  return `n-${Math.random().toString(36).slice(2, 10)}`;
}

function tableMissing(message: string) {
  return /rr_notifications|rr_push_tokens|does not exist|schema cache/i.test(
    message,
  );
}

type NotifyInput = {
  audience: NotificationAudience;
  riderPhone?: string | null;
  driverId?: string | null;
  shopId?: string | null;
  type: string;
  title: string;
  body: string;
  href?: string | null;
  jobId?: string | null;
  shopOrderId?: string | null;
  fcmToken?: string | null;
  /** Default true except admin (inbox-only unless ADMIN_FCM_TOKEN is set). */
  push?: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __villageNotifyStore: AppNotification[] | undefined;
}

function mockRows(): AppNotification[] {
  if (!globalThis.__villageNotifyStore) {
    globalThis.__villageNotifyStore = [];
  }
  return globalThis.__villageNotifyStore;
}

function matchesPhone(stored: string | null, needle: string) {
  if (!needle || !stored) return false;
  return phoneKey(stored) === needle || stored.replace(/\D/g, "").endsWith(needle);
}

function toRow(input: NotifyInput): AppNotification {
  return {
    id: randId(),
    audience: input.audience,
    rider_phone: input.riderPhone ? phoneKey(input.riderPhone) : null,
    driver_id: input.driverId ?? null,
    shop_id: input.shopId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    job_id: input.jobId ?? null,
    shop_order_id: input.shopOrderId ?? null,
    read_at: null,
    created_at: new Date().toISOString(),
  };
}

function shouldPush(input: NotifyInput) {
  if (input.push === false) return false;
  if (input.audience === "admin") return Boolean(process.env.ADMIN_FCM_TOKEN?.trim());
  return true;
}

async function resolveToken(input: NotifyInput): Promise<string | null> {
  if (input.fcmToken?.trim()) return input.fcmToken.trim();
  if (input.audience === "admin") {
    return process.env.ADMIN_FCM_TOKEN?.trim() || null;
  }
  if (!useDb()) return null;
  const admin = createAdminClient();
  try {
    if (input.audience === "rider" && input.riderPhone) {
      const key = phoneKey(input.riderPhone);
      const { data: saved } = await admin
        .from("rr_push_tokens")
        .select("token")
        .eq("audience", "rider")
        .eq("rider_phone", key)
        .maybeSingle();
      if (saved?.token) return saved.token as string;
      const { data: job } = await admin
        .from("rr_jobs")
        .select("customer_fcm_token")
        .not("customer_fcm_token", "is", null)
        .ilike("customer_phone", `%${key}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (job?.customer_fcm_token as string | null) ?? null;
    }
    if (input.audience === "driver" && input.driverId) {
      const { data } = await admin
        .from("rr_drivers")
        .select("fcm_token")
        .eq("id", input.driverId)
        .maybeSingle();
      return (data?.fcm_token as string | null) ?? null;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!tableMissing(msg)) console.error("[notify:token]", msg);
  }
  return null;
}

/** Persist inbox row + optional FCM. Never throws. */
export async function notifyInbox(
  input: NotifyInput,
): Promise<AppNotification | null> {
  const row = toRow(input);

  if (!useDb()) {
    mockRows().unshift(row);
    if (mockRows().length > 400) mockRows().length = 400;
  } else {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("rr_notifications")
        .insert({
          audience: row.audience,
          rider_phone: row.rider_phone,
          driver_id: row.driver_id,
          shop_id: row.shop_id,
          type: row.type,
          title: row.title,
          body: row.body,
          href: row.href,
          job_id: row.job_id,
          shop_order_id: row.shop_order_id,
        })
        .select("*")
        .single();
      if (error) {
        if (tableMissing(error.message)) {
          mockRows().unshift(row);
        } else {
          console.error("[notify:insert]", error.message);
        }
      } else if (data) {
        Object.assign(row, data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (tableMissing(msg)) mockRows().unshift(row);
      else console.error("[notify:insert]", msg);
    }
  }

  if (shouldPush(input)) {
    const token = await resolveToken(input);
    await sendPushToToken(token, {
      title: input.title,
      body: input.body,
      data: {
        url: input.href || "/",
        type: input.type,
        jobId: input.jobId || "",
      },
    });
  }

  return row;
}

export async function listInbox(params: {
  audience: NotificationAudience;
  riderPhone?: string | null;
  driverId?: string | null;
  limit?: number;
}): Promise<AppNotification[]> {
  const limit = params.limit ?? 40;
  const key = phoneKey(params.riderPhone);

  if (!useDb()) {
    return mockRows()
      .filter((n) => {
        if (n.audience !== params.audience) return false;
        if (params.audience === "rider") return matchesPhone(n.rider_phone, key);
        if (params.audience === "driver") return n.driver_id === params.driverId;
        return true;
      })
      .slice(0, limit);
  }

  try {
    const admin = createAdminClient();
    let q = admin
      .from("rr_notifications")
      .select("*")
      .eq("audience", params.audience)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (params.audience === "rider") {
      if (key.length < 9) return [];
      q = q.eq("rider_phone", key);
    } else if (params.audience === "driver") {
      if (!params.driverId) return [];
      q = q.eq("driver_id", params.driverId);
    }
    const { data, error } = await q;
    if (error) {
      if (tableMissing(error.message)) {
        return mockRows()
          .filter((n) => n.audience === params.audience)
          .slice(0, limit);
      }
      throw new Error(error.message);
    }
    return (data ?? []) as AppNotification[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (tableMissing(msg)) return mockRows().slice(0, limit);
    console.error("[notify:list]", msg);
    return [];
  }
}

export async function unreadInboxCount(params: {
  audience: NotificationAudience;
  riderPhone?: string | null;
  driverId?: string | null;
}): Promise<number> {
  const rows = await listInbox({ ...params, limit: 40 });
  return rows.filter((n) => !n.read_at).length;
}

export async function markInboxRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const now = new Date().toISOString();
  for (const n of mockRows()) {
    if (ids.includes(n.id) && !n.read_at) n.read_at = now;
  }
  if (!useDb()) return;
  try {
    const admin = createAdminClient();
    await admin
      .from("rr_notifications")
      .update({ read_at: now })
      .in("id", ids)
      .is("read_at", null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!tableMissing(msg)) console.error("[notify:read]", msg);
  }
}

export async function saveRiderPushToken(phone: string, token: string) {
  const key = phoneKey(phone);
  if (key.length < 9 || !token.trim()) return;
  if (!useDb()) return;
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data: existing } = await admin
      .from("rr_push_tokens")
      .select("id")
      .eq("audience", "rider")
      .eq("rider_phone", key)
      .maybeSingle();
    if (existing?.id) {
      await admin
        .from("rr_push_tokens")
        .update({ token: token.trim(), updated_at: now })
        .eq("id", existing.id);
      return;
    }
    await admin.from("rr_push_tokens").insert({
      audience: "rider",
      rider_phone: key,
      token: token.trim(),
      updated_at: now,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!tableMissing(msg)) console.error("[notify:token-save]", msg);
  }
}

function zar(amount: number | null | undefined) {
  return formatMoney(Number(amount) || 0).replace("R ", "R");
}

function tripHref(job: Pick<Job, "reference_code">) {
  return `/trip/${job.reference_code}`;
}

function etaLabel(job: Job, driver?: Driver | null) {
  if (
    driver?.last_lat != null &&
    driver?.last_lng != null &&
    job.pickup_lat != null &&
    job.pickup_lng != null
  ) {
    const mins = etaMinutes(
      distanceKm(
        { lat: driver.last_lat, lng: driver.last_lng },
        { lat: job.pickup_lat, lng: job.pickup_lng },
      ),
    );
    return ` ETA: ${mins} min.`;
  }
  return "";
}

export async function notifyRiderSearching(job: Job) {
  await notifyInbox({
    audience: "rider",
    riderPhone: job.customer_phone,
    jobId: job.id,
    type: "ride_requested",
    title: "Finding a driver",
    body: "Finding a driver near you...",
    href: tripHref(job),
    fcmToken: job.customer_fcm_token,
  });
}

export async function notifyDriverNewOffer(job: Job, driver: Driver) {
  const price = zar(job.fee_amount);
  const shop = Boolean(job.shop_id);
  await notifyInbox({
    audience: "driver",
    driverId: driver.id,
    jobId: job.id,
    type: "job_offer",
    title: shop ? "New delivery request" : "New Ride Request",
    body: shop
      ? `Collect from ${job.pickup_landmark}. ${price}. Accept?`
      : `New ride: Pick up from ${job.pickup_landmark}. ${price}. Accept?`,
    href: "/driver/home",
    fcmToken: driver.fcm_token,
  });
}

export async function notifyRiderDriverAssigned(job: Job, driver: Driver) {
  const name = firstName(driver.full_name);
  await notifyInbox({
    audience: "rider",
    riderPhone: job.customer_phone,
    jobId: job.id,
    type: "driver_assigned",
    title: "Driver assigned",
    body: `${name} has accepted your ride.${etaLabel(job, driver)}`,
    href: tripHref(job),
    fcmToken: job.customer_fcm_token,
  });
}

export async function notifyDriverRideAccepted(job: Job, driverId: string) {
  await notifyInbox({
    audience: "driver",
    driverId,
    jobId: job.id,
    type: "ride_accepted",
    title: "Rider confirmed",
    body: `Head to ${job.pickup_landmark}.`,
    href: "/driver/jobs",
  });
}

export async function notifyRiderArriving(job: Job, driver: Driver) {
  await notifyInbox({
    audience: "rider",
    riderPhone: job.customer_phone,
    jobId: job.id,
    type: "driver_arriving",
    title: "Driver arriving",
    body: "Your driver is arriving now. Please be ready.",
    href: tripHref(job),
    fcmToken: job.customer_fcm_token,
  });
}

export async function notifyRiderTripStarted(job: Job) {
  const dest = job.dropoff_landmark || "your destination";
  await notifyInbox({
    audience: "rider",
    riderPhone: job.customer_phone,
    jobId: job.id,
    type: "trip_started",
    title: "Trip started",
    body: `Trip started. You're on your way to ${dest}.`,
    href: tripHref(job),
    fcmToken: job.customer_fcm_token,
  });
}

export async function notifyRiderTripCompleted(job: Job, driver?: Driver | null) {
  const name = firstName(driver?.full_name, "your driver");
  const pay =
    job.payment_method === "cash"
      ? ` Rate ${name} and pay ${zar(job.fee_amount)}.`
      : ` Rate ${name}.`;
  await notifyInbox({
    audience: "rider",
    riderPhone: job.customer_phone,
    jobId: job.id,
    type: "trip_completed",
    title: "Trip complete",
    body: `Trip complete.${pay}`,
    href: tripHref(job),
    fcmToken: job.customer_fcm_token,
  });
}

export async function notifyDriverTripCompleted(
  job: Job,
  driverId: string,
  earned: number,
) {
  await notifyInbox({
    audience: "driver",
    driverId,
    jobId: job.id,
    type: "trip_completed",
    title: "Trip complete",
    body: `Trip complete. You earned ${zar(earned)}.`,
    href: "/driver/earnings",
  });
}

export async function notifyDriverRiderCanceled(job: Job) {
  if (!job.driver_id && !job.offered_driver_id) return;
  const driverId = job.driver_id || job.offered_driver_id;
  if (!driverId) return;
  await notifyInbox({
    audience: "driver",
    driverId,
    jobId: job.id,
    type: "ride_canceled",
    title: "Ride canceled",
    body: "Rider canceled. Request removed.",
    href: "/driver/home",
  });
}

export async function notifyRiderPaymentFailed(phone: string) {
  await notifyInbox({
    audience: "rider",
    riderPhone: phone,
    type: "payment_failed",
    title: "Payment failed",
    body: "Payment failed. Please try again or use a different method.",
    href: "/account/payment",
  });
}

export async function notifyRiderOrderPlaced(order: ShopOrder) {
  await notifyInbox({
    audience: "rider",
    riderPhone: order.customer_phone,
    shopId: order.shop_id,
    shopOrderId: order.id,
    type: "order_placed",
    title: "Order placed",
    body: "Order placed! Your items are being packed.",
    href: "/activity",
  });
}

export async function notifyRiderOrderReady(order: ShopOrder) {
  await notifyInbox({
    audience: "rider",
    riderPhone: order.customer_phone,
    shopId: order.shop_id,
    shopOrderId: order.id,
    type: "order_ready",
    title: "Order ready",
    body: "Your order is ready for pickup.",
    href: "/activity",
  });
}

export async function notifyRiderOrderOnTheWay(order: Pick<ShopOrder, "id" | "shop_id" | "customer_phone">) {
  await notifyInbox({
    audience: "rider",
    riderPhone: order.customer_phone,
    shopId: order.shop_id,
    shopOrderId: order.id,
    type: "order_on_the_way",
    title: "Out for delivery",
    body: "Your order is on the way!",
    href: "/activity",
  });
}

export async function notifyRiderOrderDelivered(order: Pick<ShopOrder, "id" | "shop_id" | "customer_phone">) {
  await notifyInbox({
    audience: "rider",
    riderPhone: order.customer_phone,
    shopId: order.shop_id,
    shopOrderId: order.id,
    type: "order_delivered",
    title: "Order delivered",
    body: "Your order has been delivered. Rate the driver.",
    href: "/activity",
  });
}

export async function notifyDriverBonus(driverId: string, amount: number) {
  await notifyInbox({
    audience: "driver",
    driverId,
    type: "bonus_earned",
    title: "Bonus earned",
    body: `You earned a ${zar(amount)} bonus! Keep it up.`,
    href: "/driver/earnings",
  });
}

export async function notifyDriverWalletTopUp(
  driverId: string,
  amount: number,
  balance?: number,
) {
  await notifyInbox({
    audience: "driver",
    driverId,
    type: "wallet_topup",
    title: "Wallet credited",
    body:
      balance != null
        ? `Your wallet has been credited with ${zar(amount)}. Balance ${zar(balance)}.`
        : `Your wallet has been credited with ${zar(amount)}.`,
    href: "/driver/earnings",
  });
}

export async function notifyDriverWeeklyEarnings(params: {
  driverId: string;
  trips: number;
  earned: number;
}) {
  if (params.trips < 1) return;
  await notifyInbox({
    audience: "driver",
    driverId: params.driverId,
    type: "weekly_earnings",
    title: "This week",
    body: `This week: ${params.trips} trip${params.trips === 1 ? "" : "s"}, ${zar(params.earned)} earned. See details.`,
    href: "/driver/earnings",
  });
}

export async function notifyAdmin(params: {
  type: string;
  title: string;
  body: string;
  href?: string;
  push?: boolean;
}) {
  await notifyInbox({
    audience: "admin",
    type: params.type,
    title: params.title,
    body: params.body,
    href: params.href ?? "/admin/dashboard",
    push: params.push ?? false,
  });
}

export async function notifyAdminDriverSignup(name: string) {
  await notifyAdmin({
    type: "driver_signup",
    title: "New driver application",
    body: `New driver application: ${firstName(name, "A driver")}. Review now.`,
    href: "/admin/verifications",
    push: true,
  });
}

export async function notifyAdminShopSignup(name: string) {
  await notifyAdmin({
    type: "shop_signup",
    title: "New shop",
    body: `New shop: ${name}. Review now.`,
    href: "/admin/signups",
    push: true,
  });
}

export async function notifyAdminDriverOnline(name: string) {
  const recent = (await listInbox({ audience: "admin", limit: 20 })).some(
    (n) =>
      n.type === "driver_online" &&
      n.body.includes(firstName(name, "Driver")) &&
      Date.now() - new Date(n.created_at).getTime() < 12 * 60 * 60 * 1000,
  );
  if (recent) return;
  await notifyAdmin({
    type: "driver_online",
    title: "Driver online",
    body: `${firstName(name, "A driver")} is now online. Ready for trips.`,
    href: "/admin/monitoring",
    push: false,
  });
}

const LOW_DRIVER_ALERT = 2;

/** Hobby-safe: call from the 5-min GitHub Actions dispatch tick, not a new cron. */
export async function maybeNotifyLowDriverCount() {
  if (!useDb()) return;
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("rr_drivers")
      .select("id", { count: "exact", head: true })
      .eq("is_online", true)
      .eq("is_active", true);
    const online = count ?? 0;
    if (online > LOW_DRIVER_ALERT) return;

    const recent = (await listInbox({ audience: "admin", limit: 12 })).some(
      (n) =>
        n.type === "low_drivers" &&
        Date.now() - new Date(n.created_at).getTime() < 6 * 60 * 60 * 1000,
    );
    if (recent) return;

    await notifyAdmin({
      type: "low_drivers",
      title: "Low driver count",
      body: `Only ${online} driver${online === 1 ? "" : "s"} online in your area.`,
      href: "/admin/monitoring",
      push: true,
    });
  } catch (err) {
    console.error("[notify:low-drivers]", err);
  }
}

export async function sendDriverWeeklyEarningsDigest() {
  if (!useDb()) return { drivers: 0 };
  const admin = createAdminClient();
  const from = new Date();
  const day = from.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  from.setDate(from.getDate() + diff);
  from.setHours(0, 0, 0, 0);

  const { data: jobs, error } = await admin
    .from("rr_jobs")
    .select("driver_id, driver_payout, fee_amount")
    .eq("status", "completed")
    .gte("completed_at", from.toISOString())
    .not("driver_id", "is", null)
    .limit(500);
  if (error) {
    console.error("[notify:weekly]", error.message);
    return { drivers: 0 };
  }

  const byDriver = new Map<string, { trips: number; earned: number }>();
  for (const row of jobs ?? []) {
    const id = row.driver_id as string;
    const earned = Number(row.driver_payout ?? row.fee_amount ?? 0);
    const cur = byDriver.get(id) ?? { trips: 0, earned: 0 };
    cur.trips += 1;
    cur.earned += Math.round(earned);
    byDriver.set(id, cur);
  }

  let n = 0;
  for (const [driverId, stats] of byDriver) {
    await notifyDriverWeeklyEarnings({
      driverId,
      trips: stats.trips,
      earned: stats.earned,
    });
    n += 1;
  }
  return { drivers: n };
}
