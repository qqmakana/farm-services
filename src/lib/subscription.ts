import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneForCountry } from "@/lib/phone";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  addMonthsIso,
  isSubscriptionActive,
  type RiderSubscription,
  type SubscriptionStatus,
  VILLAGE_PASS_TIER,
} from "@/lib/village-pass";
function normalizePhone(phone: string, countryCode?: string | null) {
  return normalizePhoneForCountry(phone, countryCode || DEFAULT_COUNTRY);
}

/** In-memory mock store when Supabase is offline. */
const mockSubs = new Map<string, RiderSubscription>();

export async function getSubscriptionByPhone(
  phone: string,
  countryCode?: string | null,
): Promise<RiderSubscription | null> {
  const key = normalizePhone(phone, countryCode);
  if (!key) return null;

  if (!hasServiceRole()) {
    return mockSubs.get(key) ?? null;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_rider_subscriptions")
    .select("*")
    .eq("phone", key)
    .maybeSingle();

  return (data as RiderSubscription) ?? null;
}

export async function getSubscriptionStatus(params: {
  phone?: string | null;
  userId?: string | null;
  countryCode?: string | null;
}): Promise<{
  isSubscribed: boolean;
  /** ISO timestamp or null — prefer string for Server Action serialization */
  expiresAt: string | null;
  status: SubscriptionStatus;
  tier: string;
}> {
  let sub: RiderSubscription | null = null;

  if (params.phone) {
    sub = await getSubscriptionByPhone(params.phone, params.countryCode);
  }

  if (!sub && params.userId && hasServiceRole()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("rr_rider_subscriptions")
      .select("*")
      .eq("user_id", params.userId)
      .maybeSingle();
    sub = (data as RiderSubscription) ?? null;
  }

  const active = isSubscriptionActive(sub);
  return {
    isSubscribed: active,
    expiresAt: sub?.subscription_expires_at ?? null,
    status: (sub?.subscription_status as SubscriptionStatus) || "none",
    tier: sub?.subscription_tier || VILLAGE_PASS_TIER,
  };
}

export async function upsertSubscriptionPending(params: {
  phone: string;
  userId?: string | null;
  countryCode?: string | null;
  paypalSubscriptionId: string;
}): Promise<void> {
  const phone = normalizePhone(params.phone, params.countryCode);
  const row: RiderSubscription = {
    phone,
    user_id: params.userId ?? null,
    country_code: params.countryCode || DEFAULT_COUNTRY,
    subscription_status: "approval_pending",
    subscription_tier: VILLAGE_PASS_TIER,
    subscription_expires_at: null,
    paypal_subscription_id: params.paypalSubscriptionId,
  };

  if (!hasServiceRole()) {
    mockSubs.set(phone, row);
    return;
  }

  const admin = createAdminClient();
  await admin.from("rr_rider_subscriptions").upsert(
    {
      ...row,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "phone" },
  );
}

export async function activateSubscription(params: {
  phone?: string | null;
  userId?: string | null;
  paypalSubscriptionId?: string | null;
  extendMonths?: number;
}): Promise<void> {
  const expires = addMonthsIso(new Date(), params.extendMonths ?? 1);

  if (!hasServiceRole()) {
    const phone = params.phone
      ? normalizePhone(params.phone)
      : [...mockSubs.keys()][0];
    if (!phone) return;
    const prev = mockSubs.get(phone);
    mockSubs.set(phone, {
      phone,
      user_id: params.userId ?? prev?.user_id ?? null,
      country_code: prev?.country_code || DEFAULT_COUNTRY,
      subscription_status: "active",
      subscription_tier: VILLAGE_PASS_TIER,
      subscription_expires_at: expires,
      paypal_subscription_id:
        params.paypalSubscriptionId ?? prev?.paypal_subscription_id ?? null,
    });
    return;
  }

  const admin = createAdminClient();
  let query = admin.from("rr_rider_subscriptions").select("*");
  if (params.paypalSubscriptionId) {
    query = query.eq("paypal_subscription_id", params.paypalSubscriptionId);
  } else if (params.phone) {
    query = query.eq("phone", normalizePhone(params.phone));
  } else if (params.userId) {
    query = query.eq("user_id", params.userId);
  } else {
    return;
  }

  const { data: existing } = await query.maybeSingle();
  if (!existing) {
    if (!params.phone && !params.userId) return;
    await admin.from("rr_rider_subscriptions").insert({
      phone: params.phone ? normalizePhone(params.phone) : `uid:${params.userId}`,
      user_id: params.userId ?? null,
      subscription_status: "active",
      subscription_tier: VILLAGE_PASS_TIER,
      subscription_expires_at: expires,
      paypal_subscription_id: params.paypalSubscriptionId ?? null,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  await admin
    .from("rr_rider_subscriptions")
    .update({
      subscription_status: "active",
      subscription_expires_at: expires,
      paypal_subscription_id:
        params.paypalSubscriptionId ?? existing.paypal_subscription_id,
      user_id: params.userId ?? existing.user_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
}

export async function setSubscriptionStatus(params: {
  paypalSubscriptionId?: string | null;
  phone?: string | null;
  status: Extract<SubscriptionStatus, "cancelled" | "expired">;
}): Promise<void> {
  if (!hasServiceRole()) {
    const phone = params.phone
      ? normalizePhone(params.phone)
      : [...mockSubs.entries()].find(
          ([, s]) => s.paypal_subscription_id === params.paypalSubscriptionId,
        )?.[0];
    if (!phone) return;
    const prev = mockSubs.get(phone);
    if (!prev) return;
    mockSubs.set(phone, { ...prev, subscription_status: params.status });
    return;
  }

  const admin = createAdminClient();
  let q = admin.from("rr_rider_subscriptions").update({
    subscription_status: params.status,
    updated_at: new Date().toISOString(),
  });
  if (params.paypalSubscriptionId) {
    q = q.eq("paypal_subscription_id", params.paypalSubscriptionId);
  } else if (params.phone) {
    q = q.eq("phone", normalizePhone(params.phone));
  } else {
    return;
  }
  await q;
}

/** Optional: attach auth uid when rider is logged in. */
export async function linkSubscriptionUserId(phone: string, userId: string) {
  if (!hasServiceRole()) return;
  const admin = createAdminClient();
  await admin
    .from("rr_rider_subscriptions")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq("phone", normalizePhone(phone));
}

export async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Local test activate (no PayPal plan). */
export async function activateLocalVillagePass(phone: string, countryCode?: string) {
  const key = normalizePhone(phone, countryCode);
  await upsertSubscriptionPending({
    phone: key,
    countryCode,
    paypalSubscriptionId: `LOCAL-VP-${Date.now().toString(36).toUpperCase()}`,
  });
  await activateSubscription({ phone: key, extendMonths: 1 });
}
