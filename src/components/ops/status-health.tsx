"use client";

import { useEffect, useState } from "react";

type Health = { ok: boolean; db: string };

export function StatusHealth() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/health")
      .then((r) => r.json() as Promise<Health>)
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch(() => {
        if (!cancelled) setHealth({ ok: false, db: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) {
    return (
      <p className="mt-2 text-[13px] text-[#666666]">Checking database…</p>
    );
  }

  if (health.ok) {
    return (
      <p className="mt-2 text-[13px] text-[#666666]">
        Database: {health.db === "ok" ? "connected (Supabase Free)" : "ok"}
      </p>
    );
  }

  return (
    <p className="mt-2 text-[13px] font-semibold text-[#CB4040]">
      Database not responding. If Supabase paused the project, open the
      dashboard and click Restore. Then WhatsApp riders that we are back.
    </p>
  );
}
