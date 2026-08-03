import { isPayPalConfigured } from "@/lib/paypal";
import {
  VILLAGE_PASS_PRICE_ZAR,
  subscriptionCustomId,
} from "@/lib/village-pass";

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

function getPlanId() {
  return process.env.PAYPAL_PLAN_ID?.trim() || "";
}

export function isVillagePassPayPalReady() {
  return isPayPalConfigured() && getPlanId().length > 8;
}

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  // Prefer PAYPAL_CLIENT_SECRET; PAYPAL_SECRET accepted as alias
  const secret =
    process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error("PayPal is not configured");
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Create a PayPal Subscription for Village Pass (R99/month).
 * Requires a billing plan in PayPal Dashboard → PAYPAL_PLAN_ID.
 */
export async function paypalCreateSubscription(params: {
  phone: string;
  userId?: string | null;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ subscriptionId: string; approveUrl: string }> {
  if (!isVillagePassPayPalReady()) {
    throw new Error(
      "Village Pass PayPal not ready. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and PAYPAL_PLAN_ID.",
    );
  }

  const token = await getAccessToken();
  const planId = getPlanId();
  const customId = subscriptionCustomId({
    phone: params.phone,
    userId: params.userId,
  });

  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: customId,
      application_context: {
        brand_name: "Village Ride",
        locale: "en-ZA",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`PayPal create subscription failed: ${await res.text()}`);
  }

  const sub = (await res.json()) as {
    id: string;
    links?: Array<{ rel: string; href: string }>;
  };
  const approveUrl = sub.links?.find((l) => l.rel === "approve")?.href;
  if (!approveUrl) {
    throw new Error("PayPal did not return an approval URL");
  }

  return { subscriptionId: sub.id, approveUrl };
}

export function villagePassPlanHint() {
  return {
    priceZar: VILLAGE_PASS_PRICE_ZAR,
    planIdConfigured: Boolean(getPlanId()),
  };
}
