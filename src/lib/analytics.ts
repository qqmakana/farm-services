import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

declare global {
  // eslint-disable-next-line no-var
  var __vrAnalytics: {
    views: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
  };
}

function store() {
  if (!globalThis.__vrAnalytics) {
    globalThis.__vrAnalytics = { views: [], events: [] };
  }
  return globalThis.__vrAnalytics;
}

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

export async function trackPageView(input: {
  page: string;
  userId?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}) {
  const row = {
    page: input.page.slice(0, 500),
    user_id: input.userId ?? null,
    user_agent: input.userAgent?.slice(0, 500) ?? null,
    referrer: input.referrer?.slice(0, 500) ?? null,
    created_at: new Date().toISOString(),
  };
  if (!useAdmin()) {
    store().views.unshift({ id: `pv-${Date.now()}`, ...row });
    return;
  }
  try {
    const admin = createAdminClient();
    await admin.from("rr_analytics_page_views").insert(row);
  } catch {
    /* table may not exist yet */
  }
}

export async function trackEvent(
  event: string,
  data?: Record<string, unknown>,
  userId?: string | null,
) {
  const row = {
    event: event.slice(0, 120),
    data: data ?? {},
    user_id: userId ?? null,
    created_at: new Date().toISOString(),
  };
  if (!useAdmin()) {
    store().events.unshift({ id: `ev-${Date.now()}`, ...row });
    return;
  }
  try {
    const admin = createAdminClient();
    await admin.from("rr_analytics_events").insert(row);
  } catch {
    /* ignore */
  }
}

export async function getAnalyticsSummary() {
  const now = Date.now();
  const dayAgo = new Date(now - 86400000).toISOString();
  const weekAgo = new Date(now - 7 * 86400000).toISOString();

  if (!useAdmin()) {
    const views = store().views;
    const events = store().events;
    return {
      pageViewsToday: views.filter((v) => String(v.created_at) >= dayAgo).length,
      eventsToday: events.filter((e) => String(e.created_at) >= dayAgo).length,
      topPages: topCount(
        views.map((v) => String(v.page)),
        5,
      ),
      topEvents: topCount(
        events.map((e) => String(e.event)),
        8,
      ),
      recentEvents: events.slice(0, 20),
      mock: true,
    };
  }

  const admin = createAdminClient();
  const [
    { count: pageViewsToday },
    { count: eventsToday },
    { data: recentViews },
    { data: recentEvents },
  ] = await Promise.all([
    admin
      .from("rr_analytics_page_views")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayAgo),
    admin
      .from("rr_analytics_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayAgo),
    admin
      .from("rr_analytics_page_views")
      .select("page")
      .gte("created_at", weekAgo)
      .limit(500),
    admin
      .from("rr_analytics_events")
      .select("event, data, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return {
    pageViewsToday: pageViewsToday ?? 0,
    eventsToday: eventsToday ?? 0,
    topPages: topCount((recentViews ?? []).map((v) => v.page), 5),
    topEvents: topCount((recentEvents ?? []).map((e) => e.event), 8),
    recentEvents: recentEvents ?? [],
    mock: false,
  };
}

function topCount(items: string[], n: number) {
  const map = new Map<string, number>();
  for (const i of items) {
    map.set(i, (map.get(i) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}
