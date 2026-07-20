"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { trackClientPageView, trackClientEvent } from "@/lib/actions-ops";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function getOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getOnline, () => true);
}

const QUEUE_KEY = "vr_offline_queue_v1";

export type QueuedAction = {
  id: string;
  type: "page_view" | "analytics_event" | string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export function readOfflineQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

export function enqueueOfflineAction(
  type: string,
  payload: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  const q = readOfflineQueue();
  q.push({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50)));
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

async function replayQueue(items: QueuedAction[]) {
  for (const item of items) {
    try {
      if (item.type === "page_view") {
        await trackClientPageView({
          page: String(item.payload.page ?? "/"),
          referrer: (item.payload.referrer as string | null) ?? null,
          userAgent: (item.payload.userAgent as string | null) ?? null,
        });
      } else if (item.type === "analytics_event") {
        await trackClientEvent(
          String(item.payload.event ?? "offline_event"),
          (item.payload.data as Record<string, unknown>) ?? {},
        );
      }
    } catch {
      /* keep going */
    }
  }
}

/** Banner + sync queued analytics when connection returns. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const [syncedMsg, setSyncedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!online) return;
    const q = readOfflineQueue();
    if (!q.length) return;
    let cancelled = false;
    void (async () => {
      await replayQueue(q);
      if (cancelled) return;
      clearOfflineQueue();
      setSyncedMsg(
        `Back online — ${q.length} offline action(s) synced.`,
      );
      window.setTimeout(() => setSyncedMsg(null), 4000);
    })();
    return () => {
      cancelled = true;
    };
  }, [online]);

  if (online && !syncedMsg) return null;

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-[80] px-3 py-2 text-center text-sm font-semibold ${
        online ? "bg-emerald-600 text-white" : "bg-amber-500 text-amber-950"
      }`}
      role="status"
    >
      {online
        ? syncedMsg
        : "You're offline — some features are unavailable until you reconnect."}
    </div>
  );
}
