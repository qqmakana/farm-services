"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMySubscriptionAction,
  getVillagePassSavingsAction,
} from "@/lib/actions-subscription";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import type { VillagePassSavings } from "@/lib/village-pass";

export function useSubscription() {
  const { countryCode } = useCountry();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [status, setStatus] = useState("none");
  const [savings, setSavings] = useState<VillagePassSavings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const guest = getGuestProfile();
      const [res, save] = await Promise.all([
        getMySubscriptionAction({
          phone: guest?.phone,
          countryCode: guest?.country_code || countryCode,
        }),
        getVillagePassSavingsAction({ phone: guest?.phone }),
      ]);
      setIsSubscribed(res.isSubscribed);
      setExpiresAt(res.expiresAt ? new Date(res.expiresAt) : null);
      setStatus(res.status);
      setSavings(save);
    } catch {
      setIsSubscribed(false);
      setExpiresAt(null);
      setStatus("none");
      setSavings(null);
    } finally {
      setLoading(false);
    }
  }, [countryCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { isSubscribed, expiresAt, status, savings, loading, refresh };
}
