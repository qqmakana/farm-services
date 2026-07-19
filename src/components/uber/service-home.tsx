"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, ChevronRight, Tractor, Truck } from "lucide-react";
import {
  emptyPlaceValue,
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";

const services = [
  {
    href: "/ride",
    title: "Village Ride",
    subtitle: "Night rides & village-to-village",
    bg: "#E3F2FD",
    Icon: Car,
    iconColor: "#1565C0",
  },
  {
    href: "/delivery",
    title: "Village Delivery",
    subtitle: "Store-to-home, furniture & materials",
    bg: "#E8F5E9",
    Icon: Truck,
    iconColor: "#2E7D32",
  },
  {
    href: "/farm",
    title: "Farm Connect",
    subtitle: "Produce, livestock & equipment",
    bg: "#FFF3E0",
    Icon: Tractor,
    iconColor: "#E65100",
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
    <div className="space-y-5 pb-2">
      <div className="space-y-4">
        <PlacesAutocomplete
          label="Pickup"
          placeholder="Village, area, or landmark"
          value={origin}
          onChange={setOrigin}
          showGps
          preferVillages
        />

        <PlacesAutocomplete
          label="Where to?"
          placeholder="Search town, village or landmark…"
          value={destination}
          onChange={setDestination}
        />

        {destination.label.trim() ? (
          <button
            type="button"
            onClick={goRide}
            className="w-full rounded-xl bg-[#1A4D3A] py-3.5 text-sm font-bold text-white transition active:scale-95"
          >
            Continue with Village Ride
          </button>
        ) : null}
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Select a service</h2>
        <div className="mt-3 space-y-3">
          {services.map((s) => {
            const Icon = s.Icon;
            return (
              <Link
                key={s.href}
                href={bookingHref(s.href, origin, destination)}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 shadow-sm transition active:scale-95"
                style={{ backgroundColor: s.bg }}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm"
                  aria-hidden
                >
                  <Icon className="h-6 w-6" style={{ color: s.iconColor }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-slate-900">
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">
                    {s.subtitle}
                  </span>
                </span>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-[#1A4D3A]/60"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
