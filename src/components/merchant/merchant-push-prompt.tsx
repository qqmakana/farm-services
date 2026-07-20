"use client";

import { saveMerchantFcmToken } from "@/lib/actions";
import { usePushNotifications } from "@/hooks/use-push-notifications";

/** Merchant: allow FCM for order updates. */
export function MerchantPushPrompt() {
  const push = usePushNotifications({
    storageKey: "vr_merchant_push_dismiss",
    saveToken: saveMerchantFcmToken,
  });

  if (!push.showPrompt) {
    if (!push.status) return null;
    return (
      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        {push.status}
      </p>
    );
  }

  return (
    <div className="ru-card mt-4 border border-[var(--ru-line)] p-4">
      <p className="text-sm font-bold text-black dark:text-white">
        Get notified about new orders
      </p>
      <p className="mt-1 text-xs text-[var(--ru-muted)]">
        Allow push so driver updates and completions ping your phone — free FCM.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={push.pending}
          onClick={push.enable}
          className="ru-btn ru-btn-primary !min-h-11 !px-4 !text-sm"
        >
          {push.pending ? "Enabling…" : "Allow"}
        </button>
        <button
          type="button"
          onClick={push.dismiss}
          className="ru-btn ru-btn-secondary !min-h-11 !px-4 !text-sm"
        >
          Not now
        </button>
      </div>
      {push.status ? (
        <p className="mt-2 text-xs text-[var(--ru-muted)]">{push.status}</p>
      ) : null}
    </div>
  );
}
