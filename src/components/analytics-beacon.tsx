"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackClientPageView } from "@/lib/actions-ops";
import {
  enqueueOfflineAction,
  useOnlineStatus,
} from "@/components/offline-banner";

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const online = useOnlineStatus();

  useEffect(() => {
    if (!pathname) return;
    const payload = {
      page: pathname,
      referrer: typeof document !== "undefined" ? document.referrer : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };
    if (!online) {
      enqueueOfflineAction("page_view", payload);
      return;
    }
    void trackClientPageView(payload);
  }, [pathname, online]);

  return null;
}
