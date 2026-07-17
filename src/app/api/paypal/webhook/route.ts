import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * PayPal webhook — set URL in PayPal Dashboard:
 * https://YOUR_DOMAIN/api/paypal/webhook
 * Also set PAYPAL_WEBHOOK_ID in env when verifying signatures (optional MVP logs events).
 */
export async function POST(req: NextRequest) {
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Supabase service role not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = body.id as string | undefined;
  const eventType = body.event_type as string | undefined;
  const resource = body.resource ?? {};

  const captureId =
    resource.id ||
    resource.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
    null;
  const orderId =
    resource.supplementary_data?.related_ids?.order_id ||
    resource.id ||
    null;

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

  // Mark job refunded / failed from webhook when applicable
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

  if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.DECLINED") {
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
      .update({ payment_status: "paid_online", paid_at: new Date().toISOString() })
      .eq("paypal_capture_id", captureId);
  }

  await admin
    .from("rr_payment_events")
    .update({ processed: true })
    .eq("event_id", eventId ?? "");

  return NextResponse.json({ ok: true });
}
