"use client";

import { useEffect, useState } from "react";
import { Briefcase, Home, MapPin } from "lucide-react";
import { listSavedLocations } from "@/lib/actions-locations";
import { getGuestProfile } from "@/lib/guest-profile";
import type { PlaceValue } from "@/components/uber/places-autocomplete";
import type { SavedLocation } from "@/lib/types";

type Props = {
  onSelect: (place: PlaceValue) => void;
};

export function SavedPlacesChips({ onSelect }: Props) {
  const [places, setPlaces] = useState<SavedLocation[]>([]);

  useEffect(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) return;
    void listSavedLocations(guest.phone)
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  if (places.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {places.map((p) => {
        const Icon = p.is_home ? Home : p.is_work ? Briefcase : MapPin;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              onSelect({
                label: p.label || p.name,
                lat: p.latitude,
                lng: p.longitude,
                locationId: p.location_id,
              })
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--ru-line)] bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-sm transition active:scale-95"
          >
            <Icon className="h-3.5 w-3.5 text-[#1A4D3A]" />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
