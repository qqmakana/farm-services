import { BRAND } from "@/lib/brand";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

declare global {
  // eslint-disable-next-line no-var
  var __vrErrorLogs: Array<Record<string, unknown>> | undefined;
}

function mockLogs() {
  if (!globalThis.__vrErrorLogs) globalThis.__vrErrorLogs = [];
  return globalThis.__vrErrorLogs;
}

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

/** Persist error + optional critical webhook/mailto notify. */
export async function logAppError(input: {
  message: string;
  stack?: string | null;
  context?: string | null;
  userId?: string | null;
  url?: string | null;
  severity?: ErrorSeverity;
}) {
  const severity = input.severity ?? "error";
  const row = {
    message: input.message.slice(0, 2000),
    stack: input.stack?.slice(0, 8000) ?? null,
    context: input.context?.slice(0, 2000) ?? null,
    user_id: input.userId ?? null,
    url: input.url?.slice(0, 1000) ?? null,
    severity,
    fixed: false,
    created_at: new Date().toISOString(),
  };

  if (!useAdmin()) {
    const id = `err-${Math.random().toString(36).slice(2, 10)}`;
    mockLogs().unshift({ id, ...row });
    console.error("[error-log:mock]", row.message, row.context);
  } else {
    try {
      const admin = createAdminClient();
      await admin.from("rr_error_logs").insert(row);
    } catch (e) {
      console.error("[error-log] insert failed", e);
    }
  }

  if (severity === "critical") {
    await notifyCriticalError(row.message, row.context, row.url);
  }

  return { ok: true };
}

async function notifyCriticalError(
  message: string,
  context: string | null,
  url: string | null,
) {
  const webhook = process.env.PARTNER_EMAIL_WEBHOOK?.trim();
  const body = {
    to: process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || BRAND.email,
    subject: `[Village Ride CRITICAL] ${message.slice(0, 80)}`,
    text: `Critical error\n\n${message}\n\nContext: ${context ?? "—"}\nURL: ${url ?? "—"}\n\nOpen /admin/errors`,
    source: "village-ride-critical",
  };
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      /* ignore */
    }
  } else {
    console.error("[critical-notify]", body.subject);
  }
}

export async function listErrorLogs(limit = 50) {
  if (!useAdmin()) {
    return mockLogs().slice(0, limit);
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function markErrorFixed(id: string, fixedBy?: string) {
  if (!useAdmin()) {
    const row = mockLogs().find((r) => r.id === id);
    if (row) {
      row.fixed = true;
      row.fixed_at = new Date().toISOString();
      row.fixed_by = fixedBy ?? "admin";
    }
    return;
  }
  const admin = createAdminClient();
  await admin
    .from("rr_error_logs")
    .update({
      fixed: true,
      fixed_at: new Date().toISOString(),
      fixed_by: fixedBy ?? "admin",
    })
    .eq("id", id);
}
