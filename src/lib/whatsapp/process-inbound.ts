import {
  buildClarificationReply,
  buildErrorReply,
  buildQuoteReply,
} from "./build-reply";
import { extractBookingFromText } from "./extract-booking";
import { quoteFromExtraction } from "./quote-from-extraction";
import type { ConciergeResult, InboundWhatsAppMessage } from "./types";

/**
 * Full concierge pipeline for one inbound text message.
 * Side effects today: console logging only (WhatsApp send later).
 */
export async function processInboundMessage(
  inbound: InboundWhatsAppMessage,
): Promise<ConciergeResult> {
  console.log("[whatsapp] inbound", {
    from: inbound.from,
    text: inbound.text,
    messageId: inbound.messageId,
    source: inbound.source,
  });

  try {
    const extraction = await extractBookingFromText(inbound.text);
    console.log("[whatsapp] extraction", extraction);

    const quote = quoteFromExtraction(extraction);
    if (!quote) {
      const reply = buildClarificationReply(extraction);
      console.log("[whatsapp] reply (clarify)", reply);
      return {
        inbound,
        extraction,
        quote: null,
        reply,
        ok: false,
        error: "incomplete_extraction",
      };
    }

    const reply = buildQuoteReply(quote);
    console.log("[whatsapp] quote", {
      vehicle: quote.vehicle,
      fee_amount: quote.fare.fee_amount,
      is_night_ride: quote.fare.is_night_ride,
    });
    console.log("[whatsapp] reply", reply);

    return {
      inbound,
      extraction,
      quote,
      reply,
      ok: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[whatsapp] process error", message);
    const reply = buildErrorReply();
    console.log("[whatsapp] reply (error)", reply);
    return {
      inbound,
      extraction: null,
      quote: null,
      reply,
      ok: false,
      error: message,
    };
  }
}
