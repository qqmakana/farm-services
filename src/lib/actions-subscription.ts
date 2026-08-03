"use server";

import { headers } from "next/headers";
import {
  activateLocalVillagePass,
  getAuthUserId,
  getSubscriptionStatus,
  upsertSubscriptionPending,
} from "@/lib/subscription";
import {
  isVillagePassPayPalReady,
  paypalCreateSubscription,
} from "@/lib/paypal-subscriptions";
import { normalizePhoneForCountry } from "@/lib/phone";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  computeVillagePassSavings,
  VILLAGE_PASS_BOOKING_FEE_ZAR,
  VILLAGE_PASS_PRICE_ZAR,
  type VillagePassSavings,
} from "@/lib/village-pass";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { mockRepo } from "@/lib/mock-store";

function siteOriginFromHeaders(h: Headers) {
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://village-ride.vercel.app";
}

/**
 * Start Village Pass PayPal subscription (R99/month).
 * Guest riders: pass phone. Auth uid attached when available.
 * Bypasses Google Play Billing — web PayPal only.
 */
export async function createPayPalSubscriptionAction(params: {
  phone: string;
  countryCode?: string | null;
  name?: string | null;
}) {
  const phone = normalizePhoneForCountry(
    params.phone,
    params.countryCode || DEFAULT_COUNTRY,
  );
  if (!phone || phone.length < 9) {
    throw new Error("Enter a valid phone number first (Account or checkout).");
  }

  const userId = await getAuthUserId();
  const h = await headers();
  const origin = siteOriginFromHeaders(h);
  const returnUrl = `${origin}/account?village_pass=success`;
  const cancelUrl = `${origin}/account?village_pass=cancelled`;

  // Local / missing plan — activate mock pass so UI can be tested
  if (!isVillagePassPayPalReady()) {
    await activateLocalVillagePass(phone, params.countryCode ?? undefined);
    return {
      mode: "local" as const,
      approveUrl: `${origin}/account?village_pass=local_active`,
      subscriptionId: null as string | null,
      message: `Local test: Village Pass activated (R${VILLAGE_PASS_PRICE_ZAR}/mo · waives R${VILLAGE_PASS_BOOKING_FEE_ZAR} booking fee). Add PAYPAL_PLAN_ID for live billing.`,
    };
  }

  const created = await paypalCreateSubscription({
    phone,
    userId,
    returnUrl,
    cancelUrl,
  });

  await upsertSubscriptionPending({
    phone,
    userId,
    countryCode: params.countryCode,
    paypalSubscriptionId: created.subscriptionId,
  });

  return {
    mode: "paypal" as const,
    approveUrl: created.approveUrl,
    subscriptionId: created.subscriptionId,
    message: null as string | null,
  };
}

export async function getMySubscriptionAction(params: {
  phone?: string | null;
  countryCode?: string | null;
}) {
  const userId = await getAuthUserId();
  return getSubscriptionStatus({
    phone: params.phone,
    userId,
    countryCode: params.countryCode,
  });
}

/**
 * Gamified Pass value: booking fees waived on Pass trips.
 * Does NOT include any km discount — driver rate stays sacred (cash-safe).
 */
export async function getVillagePassSavingsAction(params: {
  phone?: string | null;
}): Promise<VillagePassSavings> {
  const empty = computeVillagePassSavings({
    passTripCountThisMonth: 0,
    passTripCountLifetime: 0,
  });
  if (!params.phone?.trim()) return empty;

  const digits = params.phone.replace(/\D/g, "");
  if (digits.length < 9) return empty;
  const local = digits.startsWith("27")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  const variants = [`0${local}`, `27${local}`, `+27${local}`, local, params.phone.trim()];

  type Row = { village_pass?: boolean | null; status: string; created_at: string };
  let rows: Row[] = [];

  if (!hasServiceRole()) {
    rows = mockRepo.listJobsByCustomerPhone(variants);
  } else {
    const admin = createAdminClient();
    const { data } = await admin
      .from("rr_jobs")
      .select("village_pass, status, created_at")
      .in("customer_phone", variants)
      .eq("village_pass", true)
      .neq("status", "cancelled")
      .limit(200);
    rows = (data ?? []) as Row[];
  }

  const passJobs = rows.filter((j) => j.village_pass && j.status !== "cancelled");
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).getTime();
  const thisMonth = passJobs.filter(
    (j) => new Date(j.created_at).getTime() >= monthStart,
  );

  return computeVillagePassSavings({
    passTripCountThisMonth: thisMonth.length,
    passTripCountLifetime: passJobs.length,
  });
}
