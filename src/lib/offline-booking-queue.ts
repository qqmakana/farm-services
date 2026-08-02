/** Queue cash bookings when offline — flush on reconnect (landmark-first). */

import type { NewJobInput } from "@/lib/types";

const PENDING_KEY = "vr_pending_bookings_v1";

export type PendingBooking = Omit<NewJobInput, "payment"> & {
  client_id: string;
  queued_at: string;
};

type PendingBlob = { items: PendingBooking[] };

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `book-${Date.now()}`;
}

export function enqueuePendingBooking(
  draft: Omit<NewJobInput, "payment">,
): PendingBooking {
  const item: PendingBooking = {
    ...draft,
    client_id: newId(),
    queued_at: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as PendingBlob)
      : ({ items: [] } as PendingBlob);
    parsed.items = [...(Array.isArray(parsed.items) ? parsed.items : []), item];
    localStorage.setItem(PENDING_KEY, JSON.stringify(parsed));
  } catch {
    /* quota */
  }
  return item;
}

export function readPendingBookings(): PendingBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingBlob;
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export function clearPendingBooking(clientId: string): void {
  try {
    const items = readPendingBookings().filter((i) => i.client_id !== clientId);
    localStorage.setItem(PENDING_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}

export function pendingBookingCount(): number {
  return readPendingBookings().length;
}
