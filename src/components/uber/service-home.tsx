"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, ChevronRight, Package, Tractor, Truck, Users } from "lucide-react";
import {
  emptyPlaceValue,
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";
import { Button } from "@/components/ui/button";
import { DriverWantedBanner } from "@/components/driver-wanted-banner";
import { OpenGroupTripsPreview } from "@/components/group/driver-group-trips-view";
import { SavedPlacesChips } from "@/components/location/saved-places-chips";

const services = [
  {
    href: "/ride",
    title: "Ride",
    subtitle: "Village to town",
    Icon: Car,
  },
  {
    href: "/delivery",
    title: "Delivery",
    subtitle: "Store to door",
    Icon: Truck,
  },
  {
    href: "/farm",
    title: "Farm",
    subtitle: "Produce & livestock",
    Icon: Tractor,
  },
  {
    href: "/courier",
    title: "Courier",
    subtitle: "Send a package",
    Icon: Package,
  },
] as const;

function bookingHref(base: string, from: PlaceValue, to: PlaceValue) {
  const params = new URLSearchParams();
  if (from.label.trim()) params.set("from", from.label.trim());
  if (from.lat != null) params.set("fromLat", String(from.lat));
  if (from.lng != null) params.set("fromLng", String(from.lng));
  if (to.label.trim()) params.set("to", to.label.trim());
  if (to.lat != null) params.set("toLat", String(to.lat));
  if (to.lng != null) params.set("toLng", String(to.lng));
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function ServiceHomeSheet() {
  const router = useRouter();
  const [origin, setOrigin] = useState<PlaceValue>(emptyPlaceValue());
  const [destination, setDestination] = useState<PlaceValue>(emptyPlaceValue());

  function goRide() {
    if (!destination.label.trim()) return;
    router.push(bookingHref("/ride", origin, destination));
  }

  return (
    <div className="ru-page-enter space-y-6 pb-2">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] leading-tight font-bold tracking-tight text-black">
          Transport for everyone
        </h1>
        <p className="mt-1 text-[15px] text-[var(--ru-muted)]">
          Village rides, delivery, farm &amp; courier — book in seconds.
        </p>
      </div>

      <DriverWantedBanner />

      <SavedPlacesChips
        onSelect={(place) => {
          if (!origin.label.trim()) setOrigin(place);
          else setDestination(place);
        }}
      />

      <div className="space-y-1 rounded-2xl border border-[var(--ru-line)] bg-[#fafafa] px-3 py-2">
        <PlacesAutocomplete
          label="Pickup"
          placeholder="Village, area, or landmark"
          value={origin}
          onChange={setOrigin}
          showGps
          preferVillages
        />
        <div className="mx-1 border-t border-[var(--ru-line)]" />
        <PlacesAutocomplete
          label="Where to?"
          placeholder="Search town, village or landmark…"
          value={destination}
          onChange={setDestination}
        />
      </div>

      {destination.label.trim() ? (
        <Button block onClick={goRide}>
          Continue
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link href="/ride" className="ru-btn ru-btn-primary text-center">
            Ride now
          </Link>
          <Link href="/group" className="ru-btn ru-btn-secondary text-center">
            Join a group ride
          </Link>
        </div>
      )}

      <OpenGroupTripsPreview limit={2} />

      <div>
        <h2 className="text-sm font-bold tracking-wide text-[var(--ru-muted)] uppercase">
          Services
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {services.map((s) => {
            const Icon = s.Icon;
            return (
              <Link
                key={s.href}
                href={bookingHref(s.href, origin, destination)}
                className="flex flex-col items-center rounded-2xl border border-[var(--ru-line)] bg-white p-3 text-center shadow-[var(--ru-shadow)] transition active:scale-95"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-2 text-sm font-bold text-black">{s.title}</span>
                <span className="mt-0.5 text-[11px] text-[var(--ru-muted)]">
                  {s.subtitle}
                </span>
              </Link>
            );
          })}
        </div>
        <Link
          href="/group"
          className="mt-2 flex items-center gap-3 rounded-2xl border border-[var(--ru-line)] bg-white px-4 py-3 shadow-[var(--ru-shadow)] transition active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A4D3A] text-white">
            <Users className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-black">Group rides</span>
            <span className="block text-xs text-[var(--ru-muted)]">
              Split the fare · shared loads too
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-[var(--ru-muted)]" />
        </Link>
      </div>

      <Link
        href="/partners"
        className="flex items-center justify-between rounded-2xl border border-[var(--ru-line)] bg-white px-4 py-3.5 shadow-[var(--ru-shadow)] transition active:scale-[0.99]"
      >
        <span>
          <span className="block text-sm font-bold text-black">
            For businesses
          </span>
          <span className="block text-xs text-[var(--ru-muted)]">
            Free signup · self-serve deliveries
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-[var(--ru-muted)]" />
      </Link>
    </div>
  );
}
