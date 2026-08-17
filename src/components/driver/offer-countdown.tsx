"use client";

import { useEffect, useState } from "react";

/** Seconds left on an exclusive driver offer (Uber-style countdown). */
export function OfferCountdown({
  expiresAt,
}: {
  expiresAt: string | null | undefined;
}) {
  const [left, setLeft] = useState(() => remaining(expiresAt));

  useEffect(() => {
    setLeft(remaining(expiresAt));
    const t = window.setInterval(() => setLeft(remaining(expiresAt)), 250);
    return () => window.clearInterval(t);
  }, [expiresAt]);

  if (left == null) return null;

  return (
    <p
      data-testid="offer-countdown"
      className="text-center text-sm font-bold tabular-nums text-black"
    >
      {left}s to accept
    </p>
  );
}

function remaining(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return 30;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return 30;
  return Math.max(0, Math.ceil(ms / 1000));
}
