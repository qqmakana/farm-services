"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listOpenGroupTrips } from "@/lib/actions-group";
import { GroupTripCard } from "@/components/group/group-trip-card";
import type { GroupTrip } from "@/lib/types";

export default function GroupRidesPage() {
  const [trips, setTrips] = useState<GroupTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listOpenGroupTrips()
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="ru-page-enter mx-auto min-h-dvh max-w-lg bg-white px-5 pb-24 pt-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-black">
        Group rides &amp; shared loads
      </h1>
      <p className="mt-1 text-sm text-[var(--ru-muted)]">
        Split the cost with others going the same way. Drivers still earn the
        full fare.
      </p>

      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
        Drivers: publish a group from the{" "}
        <Link href="/driver/group" className="font-bold underline">
          driver app
        </Link>
        .
      </div>

      <section className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--ru-muted)]">Loading groups…</p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-[var(--ru-muted)]">
            No open groups right now. Check back soon, or book a private ride.
          </p>
        ) : (
          trips.map((t) => <GroupTripCard key={t.id} trip={t} />)
        )}
      </section>

      <Link
        href="/ride"
        className="ru-btn ru-btn-secondary ru-btn-block mt-8 text-center"
      >
        Book a private ride instead
      </Link>
    </main>
  );
}
