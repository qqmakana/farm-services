"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { createCommunityLocation } from "@/lib/actions-locations";
import { LocationPinPicker } from "@/components/location/location-pin-picker";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import type { PlaceValue } from "@/components/uber/places-autocomplete";
import type { LocationCategory } from "@/lib/types";

type Props = {
  initialName?: string;
  onClose: () => void;
  onCreated: (place: PlaceValue) => void;
};

const CATEGORIES: { value: LocationCategory; label: string }[] = [
  { value: "shop", label: "Shop" },
  { value: "farm", label: "Farm" },
  { value: "landmark", label: "Landmark" },
  { value: "home", label: "Home" },
  { value: "other", label: "Other" },
];

export function AddLocationModal({ initialName = "", onClose, onCreated }: Props) {
  const { countryCode } = useCountry();
  const guest = typeof window !== "undefined" ? getGuestProfile() : null;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<LocationCategory>("landmark");
  const [description, setDescription] = useState("");
  const [village, setVillage] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const loc = await createCommunityLocation({
          name,
          category,
          description,
          village,
          latitude: lat!,
          longitude: lng!,
          country_code: countryCode,
          created_by_phone: guest?.phone,
          created_by_name: guest?.name,
        });
        const label = `${loc.name} · ${loc.village}`;
        onCreated({
          label,
          lat: loc.latitude,
          lng: loc.longitude,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-location-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <form
        onSubmit={onSubmit}
        className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="add-location-title"
              className="font-[family-name:var(--font-display)] text-lg font-bold text-black"
            >
              Add a missing location
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ru-muted)]">
              Everyone will be able to find it when booking.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium">
            Location name
            <input
              required
              className="ru-input mt-1"
              placeholder="e.g. Sipho's Farm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <fieldset>
            <legend className="text-sm font-medium">Category</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    category === c.value
                      ? "bg-black text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-medium">
            Description
            <input
              className="ru-input mt-1"
              placeholder="Next to the blue water tank"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Village / town
            <input
              required
              className="ru-input mt-1"
              placeholder="e.g. Qunu"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />
          </label>

          <LocationPinPicker
            lat={lat}
            lng={lng}
            onChange={(a, b) => {
              setLat(a);
              setLng(b);
            }}
          />

          {guest?.name ? (
            <p className="text-xs text-[var(--ru-muted)]">
              Submitted by {guest.name}
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="ru-btn ru-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || lat == null || lng == null}
            className="ru-btn ru-btn-primary"
          >
            {pending ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
