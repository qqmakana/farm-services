"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  PaymentSelector,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-selector";
import { FareBreakdownCard } from "@/components/uber/fare-breakdown-card";
import { useCountry } from "@/components/country/country-provider";
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
  const { country, countryCode } = useCountry();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<CheckoutPaymentChoice>("cash");
  const [pending, start] = useTransition();

  const spotsLeft = Math.max(0, trip.capacity - trip.seats_taken);
  const participants = trip.participants ?? [];
  const title =
    trip.title?.trim() ||
    `Group ${trip.kind === "goods" ? "load" : "ride"} to ${trip.route_dropoff}`;

  const perSeat = Number(trip.price_per_person) || 0;
  const total = useMemo(() => Math.round(perSeat * seats), [perSeat, seats]);

  function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (payMethod === "card") {
      setError(
        "Card for group seats is coming soon — choose cash and pay the driver, or book a private ride.",
      );
      return;
    }
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
    <article className="rounded-2xl bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-black">{title}</p>
          <p className="mt-1 text-xs text-[var(--ru-muted)]">
            {trip.route_pickup} → {trip.route_dropoff}
            {trip.route_stops?.length
              ? ` · via ${trip.route_stops.join(", ")}`
              : ""}
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--ru-ink)]">
            {formatMoney(perSeat, country.currency, countryCode)} per{" "}
            {trip.kind === "goods" ? "package" : "person"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            spotsLeft > 0
              ? "bg-emerald-50 text-emerald-800"
              : "bg-gray-100 text-gray-600"
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
        <form
          onSubmit={onJoin}
          className="mt-3 space-y-3 border-t border-gray-100 pt-3"
        >
          {error ? (
            <p className="rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </p>
          ) : null}
          <input
            required
            placeholder="Your name"
            className="ru-soft-field text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            placeholder="WhatsApp / phone"
            inputMode="tel"
            className="ru-soft-field text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <label className="block text-xs font-semibold text-gray-600">
            Seats / packages
            <input
              type="number"
              min={1}
              max={Math.min(10, spotsLeft)}
              className="ru-soft-field mt-1 text-sm"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value) || 1)}
            />
          </label>

          <FareBreakdownCard
            baseFare={total}
            distanceFare={0}
            platformFee={0}
            total={total}
            currency={country.currency}
            villagePass={false}
          />

          <PaymentSelector
            value={payMethod}
            onChange={setPayMethod}
            currencyLabel={country.currencySymbol}
          />

          {payMethod === "cash" ? (
            <p className="rounded-2xl bg-gray-100 px-3 py-2 text-xs text-gray-600">
              Pay the driver in cash when you board. Driver keeps the full seat
              fare for this shared trip.
            </p>
          ) : (
            <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Card checkout for group seats is rolling out — use cash for now,
              or book a private ride for card/Village Pass.
            </p>
          )}

          <button
            type="submit"
            data-testid="book-button"
            disabled={pending || payMethod === "card"}
            className="ru-btn-book ru-btn-block"
          >
            {pending ? "Booking…" : "Book Now"}
          </button>
        </form>
      ) : null}
    </article>
  );
}
