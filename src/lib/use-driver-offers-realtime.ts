"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Instant job-offer updates for the driver board (Supabase Realtime only — no Firebase).
 */
export function useDriverOffersRealtime(
  driverId: string | null,
  onChange: () => void,
) {
  useEffect(() => {
    if (!driverId) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.includes("YOUR_PROJECT")) return;

    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`driver-offers-${driverId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rr_job_applications",
            filter: `driver_id=eq.${driverId}`,
          },
          () => onChange(),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rr_jobs",
            filter: `offered_driver_id=eq.${driverId}`,
          },
          () => onChange(),
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
  }, [driverId, onChange]);
}
