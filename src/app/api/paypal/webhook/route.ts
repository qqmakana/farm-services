import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import {
  activateSubscription,
  setSubscriptionStatus,
} from "@/lib/subscription";
import { parseSubscriptionCustomId } from "@/lib/village-pass";

export const runtime = "nodejs";

/**
 * PayPal webhook — set URL in PayPal Dashboard:
 * https://YOUR_DOMAIN/api/paypal/webhook
 *
 * Handles one-time captures AND Village Pass subscriptions.
 * Also set PAYPAL_WEBHOOK_ID when verifying signatures (optional MVP logs events).
 */
export async function POST(req: NextRequest) {
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Supabase service role not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = body.id as string | undefined;
  const eventType = body.event_type as string | undefined;
  const resource = (body.resource ?? {}) as Record<string, unknown>;

  const captureId =
    (resource.id as string) ||
    (resource as { purchase_units?: Array<{ payments?: { captures?: Array<{ id: string }> } }> })
      .purchase_units?.[0]?.payments?.captures?.[0]?.id ||
    null;
  const orderId =
    (resource as { supplementary_data?: { related_ids?: { order_id?: string } } })
      .supplementary_data?.related_ids?.order_id ||
    (typeof resource.id === "string" ? resource.id : null);

  const admin = createAdminClient();

  if (eventId) {
    const { data: existing } = await admin
      .from("rr_payment_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  await admin.from("rr_payment_events").insert({
    provider: "paypal",
    event_id: eventId,
    event_type: eventType ?? "unknown",
    paypal_order_id: orderId,
    paypal_capture_id: captureId,
    payload: body,
    processed: false,
  });

  // ——— Village Pass subscriptions ———
  const customId =
    (resource.custom_id as string) ||
    (resource.customId as string) ||
    null;
  const subId =
    (typeof resource.id === "string" &&
    String(eventType || "").includes("SUBSCRIPTION")
      ? resource.id
      : null) ||
    (resource.billing_agreement_id as string) ||
    null;
  const parsed = parseSubscriptionCustomId(customId);

  if (
    eventType === "BILLING.SUBSCRIPTION.ACTIVATED" ||
    eventType === "BILLING.SUBSCRIPTION.RE-ACTIVATED"
  ) {
    await activateSubscription({
      phone: parsed.phone,
      userId: parsed.userId,
      paypalSubscriptionId: subId || (resource.id as string),
      extendMonths: 1,
    });
  }

  if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
    await setSubscriptionStatus({
      paypalSubscriptionId: (resource.id as string) || subId,
      phone: parsed.phone,
      status: "cancelled",
    });
  }

  if (
    eventType === "BILLING.SUBSCRIPTION.EXPIRED" ||
    eventType === "BILLING.SUBSCRIPTION.SUSPENDED"
  ) {
    await setSubscriptionStatus({
      paypalSubscriptionId: (resource.id as string) || subId,
      phone: parsed.phone,
      status: "expired",
    });
  }

  // Recurring Village Pass payment — extend expiry
  if (
    eventType === "PAYMENT.SALE.COMPLETED" ||
    eventType === "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED"
  ) {
    const billingSubId =
      (resource.billing_agreement_id as string) ||
      (resource.id as string) ||
      subId;
    if (billingSubId || parsed.phone || parsed.userId) {
      await activateSubscription({
        phone: parsed.phone,
        userId: parsed.userId,
        paypalSubscriptionId: billingSubId,
        extendMonths: 1,
      });
    }
  }

  // ——— One-time job captures ———
  if (
    eventType === "PAYMENT.CAPTURE.REFUNDED" ||
    eventType === "PAYMENT.CAPTURE.REVERSED"
  ) {
    if (captureId) {
      await admin
        .from("rr_jobs")
        .update({ payment_status: "refunded" })
        .eq("paypal_capture_id", captureId);
    }
  }

  if (
    eventType === "PAYMENT.CAPTURE.DENIED" ||
    eventType === "PAYMENT.CAPTURE.DECLINED"
  ) {
    if (captureId) {
      await admin
        .from("rr_jobs")
        .update({ payment_status: "failed" })
        .eq("paypal_capture_id", captureId);
    }
  }

  if (eventType === "PAYMENT.CAPTURE.COMPLETED" && captureId) {
    await admin
      .from("rr_jobs")
      .update({
        payment_status: "paid_online",
        paid_at: new Date().toISOString(),
      })
      .eq("paypal_capture_id", captureId);
  }

  await admin
    .from("rr_payment_events")
    .update({ processed: true })
    .eq("event_id", eventId ?? "");

  return NextResponse.json({ ok: true });
}
