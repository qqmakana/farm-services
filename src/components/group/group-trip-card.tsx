"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinGroupTrip } from "@/lib/actions-group";
import { formatMoney } from "@/lib/format";
import { driverInitials } from "@/lib/driver-display";
import type { GroupTrip } from "@/lib/types";

type Props = {
  trip: GroupTrip;
  showJoin?: boolean;
};

export function GroupTripCard({ trip, showJoin = true }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const spotsLeft = Math.max(0, trip.capacity - trip.seats_taken);
  const participants = trip.participants ?? [];
  const title =
    trip.title?.trim() ||
    `Group ${trip.kind === "goods" ? "load" : "ride"} to ${trip.route_dropoff}`;

  function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await joinGroupTrip({
          group_trip_id: trip.id,
          guest_name: name,
          guest_phone: phone,
          seats,
        });
        setOpen(false);
        router.push(`/group/${trip.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not join");
      }
    });
  }

  return (
    <article className="ru-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-black">{title}</p>
          <p className="mt-1 text-xs text-[var(--ru-muted)]">
            {trip.route_pickup} → {trip.route_dropoff}
            {trip.route_stops?.length
              ? ` · via ${trip.route_stops.join(", ")}`
              : ""}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1A4D3A]">
            {formatMoney(Number(trip.price_per_person))} per{" "}
            {trip.kind === "goods" ? "package" : "person"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            spotsLeft > 0
              ? "bg-emerald-50 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
        </span>
      </div>

      {participants.length > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map((p) => (
              <span
                key={p.id}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white ring-2 ring-white"
                title={p.guest_name}
              >
                {driverInitials(p.guest_name)}
              </span>
            ))}
          </div>
          <span className="text-xs text-[var(--ru-muted)]">
            {trip.seats_taken}/{trip.capacity} joined
          </span>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--ru-muted)]">
          Be the first to join · {trip.capacity} spots
        </p>
      )}

      {trip.drivers ? (
        <p className="mt-2 text-xs text-[var(--ru-muted)]">
          Driver: {trip.drivers.full_name} · ★
          {Number(trip.drivers.rating_avg).toFixed(1)}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/group/${trip.id}`}
          className="ru-btn ru-btn-secondary !min-h-10 !px-4 !text-xs"
        >
          Details
        </Link>
        {showJoin && spotsLeft > 0 && trip.status === "open" ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ru-btn ru-btn-primary !min-h-10 !px-4 !text-xs"
          >
            Join this group
          </button>
        ) : null}
      </div>

      {open ? (
        <form onSubmit={onJoin} className="mt-3 space-y-2 border-t border-[var(--ru-line)] pt-3">
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </p>
          ) : null}
          <input
            required
            placeholder="Your name"
            className="ru-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            placeholder="WhatsApp / phone"
            inputMode="tel"
            className="ru-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <label className="block text-xs font-medium text-slate-600">
            Seats / packages
            <input
              type="number"
              min={1}
              max={Math.min(10, spotsLeft)}
              className="ru-input mt-1"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value) || 1)}
            />
          </label>
          <p className="text-xs text-[var(--ru-muted)]">
            You pay {formatMoney(Number(trip.price_per_person) * seats)} ·
            driver earns the full fare when the trip runs.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="ru-btn ru-btn-primary ru-btn-block"
          >
            {pending ? "Joining…" : "Confirm join"}
          </button>
        </form>
      ) : null}
    </article>
  );
}
