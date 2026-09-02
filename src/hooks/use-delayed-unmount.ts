"use client";

import { useEffect, useState } from "react";

/** Keep a panel mounted through its exit animation (sheets, overlays). */
export function useDelayedUnmount(open: boolean, ms = 300) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!open && mounted) {
      setLeaving(true);
      const t = window.setTimeout(() => {
        setMounted(false);
        setLeaving(false);
      }, ms);
      return () => window.clearTimeout(t);
    }
  }, [open, ms, mounted]);

  return { mounted: open || mounted, leaving };
}
