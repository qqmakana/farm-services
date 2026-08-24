"use client";

import { AppLink } from "@/components/ui/app-link";
import { useEffect, useState } from "react";
import { listOpenGroupTrips } from "@/lib/actions-group";
import { GroupTripCard } from "@/components/group/group-trip-card";
import { ServicePills } from "@/components/uber/service-pills";
import type { GroupTrip } from "@/lib/types";
import { SERVICE_COPY } from "@/lib/service-guide";
import {
  UBER_BTN_BLACK,
  UBER_GLOSS,
  UBER_H1,
  UBER_PAGE,
  UBER_SUB,
} from "@/components/customer/uber-chrome";

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
    <main className={UBER_PAGE}>
      <ServicePills className="mb-5" />

      <h1 className={UBER_H1}>{SERVICE_COPY.groups.title}</h1>
      <p className={UBER_SUB}>
        Groups is a shared ride — max 4 passengers, 60% of a private Trip.
        You join a driver who already has a route. Trip is a private car just
        for you.
      </p>

      <div className={`mt-4 rounded-[28px] px-4 py-3 text-[13px] font-medium text-[#0a0a0a] ${UBER_GLOSS}`}>
        Drivers: publish a group from the{" "}
        <AppLink
          href="/driver/group"
          className="uber-press font-bold text-black underline"
        >
          driver app
        </AppLink>
        .
      </div>

      <section className="mt-6 space-y-3">
        {loading ? (
          <p className="text-[15px] font-medium text-[#6b6b6b]">Loading groups…</p>
        ) : trips.length === 0 ? (
          <div className={`rounded-[28px] px-4 py-8 text-center ${UBER_GLOSS}`}>
            <p className="text-[15px] font-bold text-[#0a0a0a]">
              No open groups right now
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#6b6b6b]">
              Check back soon, or book a private ride.
            </p>
          </div>
        ) : (
          trips.map((t) => <GroupTripCard key={t.id} trip={t} />)
        )}
      </section>

      <a
        href="/ride"
        className={`${UBER_BTN_BLACK} mt-8 block text-center`}
      >
        Book a private Trip instead
      </a>
    </main>
  );
}
