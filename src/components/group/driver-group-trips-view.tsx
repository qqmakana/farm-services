"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  createGroupTrip,
  listDriverGroupTrips,
  listOpenGroupTrips,
} from "@/lib/actions-group";
import { GroupTripCard } from "@/components/group/group-trip-card";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import type { GroupTrip, GroupTripKind } from "@/lib/types";

export function DriverGroupTripsView() {
  const { driver, driverId } = useDriverApp();
  const [mine, setMine] = useState<GroupTrip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    kind: "ride" as GroupTripKind,
    title: "",
    route_pickup: "",
    route_dropoff: "",
    route_stops: "",
    capacity: "4",
    price_per_person: "100",
  });

  useEffect(() => {
    if (!driverId) return;
    void listDriverGroupTrips(driverId).then(setMine).catch(() => setMine([]));
  }, [driverId]);

  if (!driver || !driverId) return null;

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const stops = form.route_stops
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const trip = await createGroupTrip({
          driver_id: driverId!,
          kind: form.kind,
          title: form.title || undefined,
          route_pickup: form.route_pickup,
          route_dropoff: form.route_dropoff,
          route_stops: stops,
          capacity: Number(form.capacity) || 4,
          price_per_person: Number(form.price_per_person) || 0,
          country_code: driver!.country_code || "ZA",
        });
        setMine((prev) => [trip, ...prev]);
        setForm({
          kind: "ride",
          title: "",
          route_pickup: "",
          route_dropoff: "",
          route_stops: "",
          capacity: "4",
          price_per_person: "100",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create");
      }
    });
  }

  return (
    <main className="ru-page-enter mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-black">
        Group trips
      </h1>
      <p className="mt-1 text-sm text-[var(--ru-muted)]">
        Create a shared ride or load. Passengers split the cost — you earn the
        full fare when it runs.
      </p>

      <form onSubmit={onCreate} className="ru-card mt-5 space-y-3 p-4">
        <p className="text-sm font-bold text-black">Create group trip</p>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </p>
        ) : null}
        <select
          className="ru-input"
          value={form.kind}
          onChange={(e) =>
            setForm({ ...form, kind: e.target.value as GroupTripKind })
          }
        >
          <option value="ride">Passengers (group ride)</option>
          <option value="goods">Packages (shared load)</option>
        </select>
        <input
          className="ru-input"
          placeholder="Title (e.g. Group Ride to Mthatha)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          required
          className="ru-input"
          placeholder="Pickup"
          value={form.route_pickup}
          onChange={(e) => setForm({ ...form, route_pickup: e.target.value })}
        />
        <input
          required
          className="ru-input"
          placeholder="Dropoff"
          value={form.route_dropoff}
          onChange={(e) => setForm({ ...form, route_dropoff: e.target.value })}
        />
        <input
          className="ru-input"
          placeholder="Stops (comma-separated, optional)"
          value={form.route_stops}
          onChange={(e) => setForm({ ...form, route_stops: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-slate-600">
            Capacity
            <input
              required
              type="number"
              min={1}
              max={40}
              className="ru-input mt-1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Price per person (R)
            <input
              required
              type="number"
              min={1}
              className="ru-input mt-1"
              value={form.price_per_person}
              onChange={(e) =>
                setForm({ ...form, price_per_person: e.target.value })
              }
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="ru-btn ru-btn-primary ru-btn-block"
        >
          {pending ? "Creating…" : "Publish group trip"}
        </button>
      </form>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-bold tracking-wide text-[var(--ru-muted)] uppercase">
          Your groups
        </h2>
        {mine.length === 0 ? (
          <p className="text-sm text-[var(--ru-muted)]">
            No group trips yet. Publish one above.
          </p>
        ) : (
          mine.map((t) => (
            <GroupTripCard key={t.id} trip={t} showJoin={false} />
          ))
        )}
      </section>

      <Link
        href="/group"
        className="mt-6 block text-center text-sm font-semibold text-[#1A4D3A]"
      >
        See all open groups →
      </Link>
    </main>
  );
}

/** Homepage / browse strip of open groups. */
export function OpenGroupTripsPreview({ limit = 3 }: { limit?: number }) {
  const [trips, setTrips] = useState<GroupTrip[]>([]);

  useEffect(() => {
    void listOpenGroupTrips()
      .then((all) => setTrips(all.slice(0, limit)))
      .catch(() => setTrips([]));
  }, [limit]);

  if (trips.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-sm font-bold tracking-wide text-[var(--ru-muted)] uppercase">
          Join a group ride
        </h2>
        <Link
          href="/group"
          className="text-xs font-semibold text-[#1A4D3A]"
        >
          See all
        </Link>
      </div>
      {trips.map((t) => (
        <GroupTripCard key={t.id} trip={t} />
      ))}
    </section>
  );
}
