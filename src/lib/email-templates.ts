import { BRAND } from "@/lib/brand";

export type EmailTemplate = {
  subject: string;
  text: string;
  htmlHint?: string;
};

export function welcomeMerchantEmail(input: {
  shopName: string;
  email: string;
  referralCode?: string | null;
  dashboardUrl: string;
}): EmailTemplate {
  return {
    subject: `Welcome to ${BRAND.appName}, ${input.shopName}!`,
    text: [
      `Hi ${input.shopName},`,
      "",
      `Your partner account is ready on ${BRAND.appName}.`,
      "",
      "Next steps:",
      "1. Open your dashboard and create your first delivery",
      "2. Share your referral code with nearby shops",
      "3. Check weekly reports every Monday",
      "",
      `Dashboard: ${input.dashboardUrl}`,
      input.referralCode ? `Your referral code: ${input.referralCode}` : "",
      "",
      `Need help? ${BRAND.email} · ${BRAND.phone}`,
      "",
      `— ${BRAND.company}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function weeklyReportEmail(input: {
  shopName: string;
  weekKey: string;
  summaryText: string;
  dashboardUrl: string;
}): EmailTemplate {
  return {
    subject: `${BRAND.appName} weekly report — ${input.weekKey}`,
    text: [
      `Hi ${input.shopName},`,
      "",
      input.summaryText,
      "",
      `Full dashboard: ${input.dashboardUrl}`,
      "",
      `— ${BRAND.appName}`,
    ].join("\n"),
  };
}

export function referralBonusEmail(input: {
  shopName: string;
  referredName: string;
  bonusZar: number;
  totalBonusZar: number;
  shareUrl: string;
}): EmailTemplate {
  return {
    subject: `Referral bonus — ${input.referredName} joined!`,
    text: [
      `Hi ${input.shopName},`,
      "",
      `${input.referredName} signed up with your code.`,
      `Bonus credited: R${input.bonusZar}`,
      `Total referral bonuses: R${input.totalBonusZar}`,
      "",
      `Keep sharing: ${input.shareUrl}`,
      "",
      `— ${BRAND.appName}`,
    ].join("\n"),
  };
}

/** mailto: helper for free-tier email without ESP. */
export function mailtoHref(to: string, tpl: EmailTemplate): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(tpl.subject)}&body=${encodeURIComponent(tpl.text)}`;
}

/** Optional free webhook (Make/n8n/Resend proxy) + email_logs audit trail. */
export async function sendViaPartnerWebhook(input: {
  to: string;
  template: EmailTemplate;
  templateKey?: string;
}): Promise<boolean> {
  const webhook = process.env.PARTNER_EMAIL_WEBHOOK?.trim();
  let sent = false;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: input.to,
          subject: input.template.subject,
          text: input.template.text,
          source: "village-ride-email",
          template: input.templateKey ?? null,
        }),
      });
      sent = res.ok;
    } catch {
      sent = false;
    }
  }

  await logEmailAttempt({
    toEmail: input.to,
    subject: input.template.subject,
    template: input.templateKey ?? "custom",
    via: webhook ? (sent ? "webhook" : "webhook_failed") : "logged_only",
  });

  return sent;
}

async function logEmailAttempt(input: {
  toEmail: string;
  subject: string;
  template: string;
  via: string;
}) {
  try {
    const { createAdminClient, hasServiceRole } = await import(
      "@/lib/supabase/admin"
    );
    const { isSupabaseConfigured } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured() || !hasServiceRole()) return;
    const admin = createAdminClient();
    await admin.from("rr_email_logs").insert({
      to_email: input.toEmail.slice(0, 320),
      subject: input.subject.slice(0, 500),
      template: input.template.slice(0, 80),
      via: input.via.slice(0, 40),
    });
  } catch {
    /* table may not exist yet */
  }
}
