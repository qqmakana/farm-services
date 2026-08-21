"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  emptyPlaceValue,
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";
import { WhereToBar } from "@/components/uber/where-to-bar";
import { PlanYourRideHeader } from "@/components/uber/plan-your-ride-header";
import { OpenGroupTripsPreview } from "@/components/group/driver-group-trips-view";
import { SavedPlacesChips } from "@/components/location/saved-places-chips";

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

export function ServiceHomeSheet({
  mapTapPin = null,
  mapTapToken = 0,
  onPinChange,
  onDropoffPinChange,
}: {
  mapTapPin?: { lat: number; lng: number } | null;
  mapTapToken?: number;
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
  onDropoffPinChange?: (pin: { lat: number; lng: number } | null) => void;
} = {}) {
  const router = useRouter();
  const [origin, setOrigin] = useState<PlaceValue>(emptyPlaceValue());
  const [destination, setDestination] = useState<PlaceValue>(emptyPlaceValue());

  useEffect(() => {
    onPinChange?.(
      origin.lat != null && origin.lng != null
        ? { lat: origin.lat, lng: origin.lng }
        : null,
    );
  }, [origin.lat, origin.lng, onPinChange]);

  useEffect(() => {
    onDropoffPinChange?.(
      destination.lat != null && destination.lng != null
        ? { lat: destination.lat, lng: destination.lng }
        : null,
    );
  }, [destination.lat, destination.lng, onDropoffPinChange]);

  useEffect(() => {
    if (!mapTapPin || !mapTapToken) return;
    setOrigin((o) => {
      if (mapTapToken === 1 && o.lat != null && o.lng != null) return o;
      return {
        ...o,
        lat: mapTapPin.lat,
        lng: mapTapPin.lng,
        label: o.label.trim() || "Current location",
      };
    });
  }, [mapTapPin, mapTapToken]);

  function goRide() {
    if (!destination.label.trim()) return;
    router.push(bookingHref("/ride", origin, destination));
  }

  return (
    <div className="space-y-4 pb-2">
      <PlanYourRideHeader
        whenMode="now"
        forMeLabel="For me"
        onToggleWhen={() => router.push("/ride?when=later")}
      />

      <WhereToBar
        pickupSlot={
          <PlacesAutocomplete
            compact
            showGps
            placeholder="Current location"
            value={origin}
            onChange={setOrigin}
          />
        }
        dropoffSlot={
          <PlacesAutocomplete
            compact
            placeholder="Where to?"
            value={destination}
            onChange={setDestination}
          />
        }
      />

      <SavedPlacesChips
        onSelect={(place) => {
          if (!origin.label.trim()) setOrigin(place);
          else setDestination(place);
        }}
      />

      {destination.label.trim() ? (
        <button
          type="button"
          data-testid="book-button"
          onClick={goRide}
          className="uber-press uber-btn-black w-full"
        >
          Choose Village Ride
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/ride"
            data-testid="book-button"
            className="uber-press uber-btn-black text-center text-base"
          >
            Ride now
          </Link>
          <Link
            href="/group"
            className="ru-btn ru-btn-secondary text-center !rounded-xl"
          >
            Group ride
          </Link>
        </div>
      )}

      <OpenGroupTripsPreview limit={2} />

      <Link
        href="/partners"
        className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3.5 transition active:scale-[0.99]"
      >
        <span>
          <span className="block text-sm font-bold text-[var(--ru-ink)]">
            For businesses
          </span>
          <span className="block text-xs text-gray-500">
            Free signup · self-serve deliveries
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </Link>

      <Link
        href="/driver/join"
        className="ru-btn ru-btn-secondary ru-btn-block !rounded-xl"
      >
        Drive with us
      </Link>
    </div>
  );
}
