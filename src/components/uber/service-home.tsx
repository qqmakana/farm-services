"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Clock } from "lucide-react";
import {
  emptyPlaceValue,
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";
import { WhereToBar } from "@/components/uber/where-to-bar";
import { PlanYourRideHeader } from "@/components/uber/plan-your-ride-header";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { SavedPlacesChips } from "@/components/location/saved-places-chips";
import { getGuestProfile } from "@/lib/guest-profile";
import { listJobsByCustomerPhone } from "@/lib/actions";
import { UBER_GLOSS } from "@/components/customer/uber-chrome";

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

const FOR_YOU: {
  href: string;
  label: string;
  src: string;
  badge?: string;
}[] = [
  { href: "/ride", label: "Trip", src: "/home/icons/car.png", badge: "20%" },
  { href: "/shops", label: "Shops", src: "/home/icons/shops.png" },
  { href: "/courier", label: "Send items", src: "/home/icons/courier.png" },
  { href: "/farm", label: "Farm", src: "/home/icons/farm.png" },
];

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
  const [laterOpen, setLaterOpen] = useState(false);
  const [recents, setRecents] = useState<
    { title: string; subtitle: string }[]
  >([]);

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

  useEffect(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) return;
    void listJobsByCustomerPhone(guest.phone)
      .then((jobs) => {
        const places = jobs
          .map((j) => ({
            title: j.dropoff_landmark || j.pickup_landmark,
            subtitle:
              j.pickup_landmark && j.dropoff_landmark
                ? `From ${j.pickup_landmark}`
                : "Recent trip",
          }))
          .filter((p) => p.title);
        const unique = [
          ...new Map(places.map((p) => [p.title, p])).values(),
        ].slice(0, 2);
        setRecents(unique);
      })
      .catch(() => undefined);
  }, []);

  function goRide() {
    if (!destination.label.trim()) return;
    router.push(bookingHref("/ride", origin, destination));
  }

  return (
    <div className="space-y-4 pb-2">
      <PlanYourRideHeader
        whenMode="now"
        forMeLabel="For me"
        onToggleWhen={() => setLaterOpen(true)}
      />

      <div data-testid="home-where-to">
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
      </div>

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
      ) : null}

      {recents.length > 0 ? (
        <ul className="divide-y divide-[#ececec]" data-testid="home-recents">
          {recents.map((place) => (
            <li key={place.title}>
              <button
                type="button"
                onClick={() =>
                  router.push(`/ride?to=${encodeURIComponent(place.title)}`)
                }
                className="uber-press flex w-full items-center gap-3 py-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eeeeee]">
                  <Clock className="h-4 w-4 text-[#0a0a0a]" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[#0a0a0a]">
                    {place.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-[#6b6b6b]">
                    {place.subtitle}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#c4c4c4]" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div data-testid="home-recents" className="sr-only">
          No recent Village Ride trips
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.3px] text-black">
            For you
          </h2>
        </div>
        <div
          data-testid="service-circles"
          className="mt-3 flex gap-5 overflow-x-auto pb-1 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label="For you"
        >
          {FOR_YOU.map(({ href, label, src, badge }, i) => (
            <Link
              key={label}
              href={href}
              data-testid={`service-circle-${label.toLowerCase().replace(/\s+/g, "-")}`}
              data-primary={i === 0 ? "true" : "false"}
              className="uber-press relative flex w-[72px] shrink-0 flex-col items-center"
            >
              {badge ? (
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-[#0a0a0a] px-1.5 py-[2px] text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
              <span
                className={`flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full bg-white ${UBER_GLOSS}`}
              >
                <Image
                  src={src}
                  alt=""
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain"
                />
              </span>
              <span className="mt-2 text-center text-[12px] font-semibold text-[#0a0a0a]">
                {label}
              </span>
            </Link>
          ))}
        </div>
        <div data-testid="home-chips" className="sr-only">
          For you
        </div>
      </div>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </div>
  );
}
