"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getGroupTrip } from "@/lib/actions-group";
import { GroupTripCard } from "@/components/group/group-trip-card";
import { DriverVehiclePhotos } from "@/components/driver-vehicle-photos";
import { formatMoney } from "@/lib/format";
import { driverInitials } from "@/lib/driver-display";
import type { GroupTrip } from "@/lib/types";

export default function GroupTripDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [trip, setTrip] = useState<GroupTrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void getGroupTrip(id)
      .then(setTrip)
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-5 py-10 text-sm text-[var(--ru-muted)]">
        Loading group…
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <p className="text-sm text-rose-700">Group trip not found.</p>
        <Link href="/group" className="mt-4 inline-block text-sm font-semibold text-[#1A4D3A]">
          ← Back to groups
        </Link>
      </main>
    );
  }

  const participants = (trip.participants ?? []).filter(
    (p) => p.status !== "cancelled",
  );

  return (
    <main className="ru-page-enter mx-auto min-h-dvh max-w-lg space-y-4 bg-white px-5 pb-24 pt-8">
      <Link href="/group" className="text-sm font-semibold text-[#1A4D3A]">
        ← All groups
      </Link>

      <GroupTripCard trip={trip} />

      {trip.drivers ? (
        <section className="ru-card p-4">
          <p className="mb-3 text-sm font-bold text-black">Your driver</p>
          <DriverVehiclePhotos driver={trip.drivers} />
        </section>
      ) : null}

      <section className="ru-card p-4">
        <h2 className="text-sm font-bold text-black">Who&apos;s going</h2>
        {participants.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ru-muted)]">No one joined yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl bg-[#fafafa] px-3 py-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                  {driverInitials(p.guest_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.guest_name}</p>
                  <p className="text-xs text-[var(--ru-muted)]">
                    {p.seats} {trip.kind === "goods" ? "pkg" : "seat"}
                    {p.seats === 1 ? "" : "s"} · {formatMoney(Number(p.amount_due))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-[var(--ru-muted)]">
          Capacity {trip.seats_taken}/{trip.capacity} · Driver earns{" "}
          {formatMoney(Number(trip.price_per_person) * trip.seats_taken)} when
          this trip runs.
        </p>
      </section>
    </main>
  );
}
