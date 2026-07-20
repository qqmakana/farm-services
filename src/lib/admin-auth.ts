import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Comma-separated allowlist. Empty = any admin/dispatcher role. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function emailIsAdminAllowlisted(email: string | null | undefined): boolean {
  const list = getAdminEmails();
  if (!list.length) return true; // no env → role check only
  if (!email) return false;
  return list.includes(email.trim().toLowerCase());
}

export type AdminGateResult = {
  ok: boolean;
  email: string | null;
  role: string | null;
  userId: string | null;
  reason?: string;
};

/** Server-side: signed-in user must be admin/dispatcher (+ optional ADMIN_EMAILS). */
export async function requireAdminAccess(): Promise<AdminGateResult> {
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    // Local mock / no auth — allow for development dashboards
    return {
      ok: true,
      email: "demo@admin.local",
      role: "admin",
      userId: "mock-admin",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, email: null, role: null, userId: null, reason: "login" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("rr_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? null;
  if (role !== "admin" && role !== "dispatcher") {
    return {
      ok: false,
      email: user.email ?? null,
      role,
      userId: user.id,
      reason: "role",
    };
  }

  if (!emailIsAdminAllowlisted(user.email)) {
    return {
      ok: false,
      email: user.email ?? null,
      role,
      userId: user.id,
      reason: "email",
    };
  }

  return {
    ok: true,
    email: user.email ?? null,
    role,
    userId: user.id,
  };
}
