"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Subscribe to job row changes (Supabase Realtime). Falls back silently if not configured. */
export function useJobRealtime(
  jobId: string | null,
  onChange: () => void,
) {
  useEffect(() => {
    if (!jobId) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.includes("YOUR_PROJECT")) return;

    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`job-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rr_jobs",
            filter: `id=eq.${jobId}`,
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
  }, [jobId, onChange]);
}
