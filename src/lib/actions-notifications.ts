"use server";

import {
  listInbox,
  markInboxRead,
  saveRiderPushToken,
  unreadInboxCount,
} from "@/lib/notifications";
import type { AppNotification, NotificationAudience } from "@/lib/types";

export async function listMyNotifications(params: {
  audience: NotificationAudience;
  riderPhone?: string | null;
  driverId?: string | null;
}): Promise<AppNotification[]> {
  return listInbox(params);
}

export async function unreadNotificationCount(params: {
  audience: NotificationAudience;
  riderPhone?: string | null;
  driverId?: string | null;
}): Promise<number> {
  return unreadInboxCount(params);
}

export async function markNotificationsReadAction(ids: string[]) {
  await markInboxRead(ids);
}

export async function saveRiderFcmTokenAction(phone: string, token: string) {
  await saveRiderPushToken(phone, token);
}

export async function recordPaymentFailedAction(phone: string) {
  const { notifyRiderPaymentFailed } = await import("@/lib/notifications");
  await notifyRiderPaymentFailed(phone);
}
