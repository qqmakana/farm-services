import type { InboundWhatsAppMessage } from "./types";

type Json = Record<string, unknown>;

function asObj(v: unknown): Json | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
}

/**
 * Accepts:
 * 1) Mock body: `{ "from": "2782…", "text": "…" }`
 * 2) Meta Cloud API webhook: `entry[].changes[].value.messages[]`
 */
export function parseInboundWhatsApp(body: unknown): InboundWhatsAppMessage[] {
  const root = asObj(body);
  if (!root) return [];

  // Mock / test payload
  if (typeof root.text === "string" && root.text.trim()) {
    return [
      {
        from: String(root.from ?? root.wa_id ?? "unknown"),
        text: root.text.trim(),
        messageId:
          typeof root.messageId === "string"
            ? root.messageId
            : typeof root.id === "string"
              ? root.id
              : undefined,
        timestamp:
          typeof root.timestamp === "string" ? root.timestamp : undefined,
        source: "mock",
        raw: body,
      },
    ];
  }

  // Meta WhatsApp Business Cloud API
  const entry = Array.isArray(root.entry) ? root.entry : [];
  const out: InboundWhatsAppMessage[] = [];

  for (const e of entry) {
    const entryObj = asObj(e);
    const changes = Array.isArray(entryObj?.changes) ? entryObj.changes : [];
    for (const change of changes) {
      const changeObj = asObj(change);
      const value = asObj(changeObj?.value);
      if (!value) continue;

      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      const contactWa =
        typeof asObj(contacts[0])?.wa_id === "string"
          ? String(asObj(contacts[0])!.wa_id)
          : undefined;

      const messages = Array.isArray(value.messages) ? value.messages : [];
      for (const msg of messages) {
        const m = asObj(msg);
        if (!m) continue;
        const textObj = asObj(m.text);
        const bodyText =
          typeof textObj?.body === "string" ? textObj.body.trim() : "";
        if (!bodyText) continue;

        out.push({
          from: String(m.from ?? contactWa ?? "unknown"),
          text: bodyText,
          messageId: typeof m.id === "string" ? m.id : undefined,
          timestamp:
            typeof m.timestamp === "string" ? m.timestamp : undefined,
          source: "meta",
          raw: msg,
        });
      }
    }
  }

  return out;
}
