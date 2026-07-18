import { after, NextRequest, NextResponse } from "next/server";
import { parseInboundWhatsApp } from "@/lib/whatsapp/parse-webhook";
import { processInboundMessage } from "@/lib/whatsapp/process-inbound";

export const runtime = "nodejs";

/**
 * WhatsApp Business webhook.
 *
 * GET  — Meta subscription verification (`hub.challenge`)
 * POST — inbound messages (Meta Cloud API or mock `{ from, text }`)
 *
 * AI work runs in `after()` so the webhook ACK stays fast.
 * Outbound WhatsApp send is not wired yet — results are logged.
 *
 * Test locally:
 *   curl -X POST http://localhost:3000/api/whatsapp/webhook \
 *     -H "Content-Type: application/json" \
 *     -d "{\"from\":\"27821234567\",\"text\":\"Need a bakkie delivery from Shoprite Mthatha to Qunu clinic tomorrow\"}"
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = parseInboundWhatsApp(body);

  // Meta sends status callbacks with no text — ACK quietly
  if (messages.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  after(async () => {
    for (const msg of messages) {
      await processInboundMessage(msg);
    }
  });

  return NextResponse.json({
    ok: true,
    processed: messages.length,
    note: "AI concierge running in background; check server logs for extraction + reply",
  });
}
