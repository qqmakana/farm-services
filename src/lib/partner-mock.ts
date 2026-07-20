import { buildWeeklySummaryText, weekBounds } from "./partner";
import type {
  PartnerNotification,
  PartnerWeeklyReport,
  Shop,
} from "./types";

type PartnerStore = {
  notifications: PartnerNotification[];
  reports: PartnerWeeklyReport[];
  /** shopId → count of referred shops (mock attribution). */
  referralCounts: Record<string, number>;
};

declare global {
  // eslint-disable-next-line no-var
  var __villagePartnerStore: PartnerStore | undefined;
}

function store(): PartnerStore {
  if (!globalThis.__villagePartnerStore) {
    globalThis.__villagePartnerStore = {
      notifications: [],
      reports: [],
      referralCounts: {},
    };
  }
  return globalThis.__villagePartnerStore;
}

export const mockPartnerStore = {
  addNotification(row: PartnerNotification): PartnerNotification {
    store().notifications.unshift(row);
    return row;
  },

  listNotifications(shopId: string): PartnerNotification[] {
    return store().notifications.filter((n) => n.shop_id === shopId);
  },

  markRead(ids: string[]) {
    const set = new Set(ids);
    for (const n of store().notifications) {
      if (set.has(n.id) && !n.read_at) {
        n.read_at = new Date().toISOString();
      }
    }
  },

  listReports(shopId: string): PartnerWeeklyReport[] {
    return store().reports.filter((r) => r.shop_id === shopId);
  },

  trackReferral(referrerShopId: string) {
    store().referralCounts[referrerShopId] =
      (store().referralCounts[referrerShopId] ?? 0) + 1;
  },

  generateWeekly(
    shop: Shop,
    weekStart: string,
    weekEnd: string,
    weekKey: string,
  ): PartnerWeeklyReport {
    return mockPartnerStore.upsertWeekly({
      shop,
      weekStart,
      weekEnd,
      weekKey,
      ordersTotal: 0,
      ordersCompleted: 0,
      ordersCancelled: 0,
      revenueTotal: 0,
      commissionTotal: 0,
      referralSignups: store().referralCounts[shop.id] ?? 0,
    });
  },

  upsertWeekly(params: {
    shop: Shop;
    weekStart: string;
    weekEnd: string;
    weekKey: string;
    ordersTotal: number;
    ordersCompleted: number;
    ordersCancelled: number;
    revenueTotal: number;
    commissionTotal: number;
    referralSignups: number;
  }): PartnerWeeklyReport {
    const summary = buildWeeklySummaryText({
      shopName: params.shop.name,
      weekKey: params.weekKey,
      weekStart: params.weekStart,
      weekEnd: params.weekEnd,
      ordersTotal: params.ordersTotal,
      ordersCompleted: params.ordersCompleted,
      ordersCancelled: params.ordersCancelled,
      revenueTotal: params.revenueTotal,
      commissionTotal: params.commissionTotal,
      referralSignups: params.referralSignups,
    });

    const existing = store().reports.find(
      (r) => r.shop_id === params.shop.id && r.week_key === params.weekKey,
    );
    if (existing) {
      existing.orders_total = params.ordersTotal;
      existing.orders_completed = params.ordersCompleted;
      existing.orders_cancelled = params.ordersCancelled;
      existing.revenue_total = params.revenueTotal;
      existing.platform_commission_total = params.commissionTotal;
      existing.referral_signups = params.referralSignups;
      existing.summary_text = summary;
      return existing;
    }

    const report: PartnerWeeklyReport = {
      id: `wr-${Math.random().toString(36).slice(2, 10)}`,
      shop_id: params.shop.id,
      week_start: params.weekStart,
      week_end: params.weekEnd,
      week_key: params.weekKey,
      orders_total: params.ordersTotal,
      orders_completed: params.ordersCompleted,
      orders_cancelled: params.ordersCancelled,
      revenue_total: params.revenueTotal,
      platform_commission_total: params.commissionTotal,
      referral_signups: params.referralSignups,
      summary_text: summary,
      email_sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    store().reports.unshift(report);
    mockPartnerStore.addNotification({
      id: `n-${Math.random().toString(36).slice(2, 10)}`,
      shop_id: params.shop.id,
      user_id: params.shop.user_id ?? null,
      type: "weekly_report",
      title: `Weekly report ${params.weekKey}`,
      body: `${params.ordersCompleted} completed · R${params.revenueTotal.toFixed(0)} fees · ${params.referralSignups} referrals`,
      email_body: summary,
      job_id: null,
      report_id: report.id,
      read_at: null,
      created_at: new Date().toISOString(),
    });
    return report;
  },

  generateAllWeekly(at = new Date()) {
    const { weekStart, weekEnd, weekKey } = weekBounds(at);
    return [{ shopId: "mock", report: null, created: false, weekKey, weekStart, weekEnd }];
  },
};
