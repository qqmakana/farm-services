"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listOpenGroupTrips } from "@/lib/actions-group";
import { GroupTripCard } from "@/components/group/group-trip-card";
import { ServicePills } from "@/components/uber/service-pills";
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
    <main className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6">
      <ServicePills className="mb-5" />

      <h1 className="text-3xl font-bold tracking-tight text-black">
        Groups near you
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Split the cost with others going the same way. Drivers still earn the
        full fare.
      </p>

      <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
        Drivers: publish a group from the{" "}
        <Link
          href="/driver/group"
          className="uber-press font-bold text-black underline"
        >
          driver app
        </Link>
        .
      </div>

      <section className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading groups…</p>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              No open groups right now
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Check back soon, or book a private ride.
            </p>
          </div>
        ) : (
          trips.map((t) => <GroupTripCard key={t.id} trip={t} />)
        )}
      </section>

      <Link
        href="/ride"
        className="uber-press uber-btn-black mt-8 flex w-full text-center"
      >
        Book a private ride instead
      </Link>
    </main>
  );
}
