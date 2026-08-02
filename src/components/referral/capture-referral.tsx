"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureReferralFromUrl } from "@/lib/rider-referral";

/** Capture ?ref= from the URL into localStorage for the R50 referral program. */
export function CaptureReferral() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const q =
      typeof window !== "undefined"
        ? window.location.search
        : `?${searchParams.toString()}`;
    captureReferralFromUrl(q.startsWith("?") ? q.slice(1) : q);
  }, [searchParams]);
  return null;
}
