"use client";

import { useEffect, useState } from "react";
import { searchAddressesAction } from "@/lib/actions-mapbox";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import { upsertSavedPlaceCache } from "@/lib/saved-places-cache";
import type { PlaceSuggestion } from "@/lib/suggestions";
import type { AddressSuggestion } from "@/lib/mapbox-types";

type Props = {
  kind: "home" | "work";
  onClose: () => void;
  onSaved: (place: PlaceSuggestion) => void;
};

export function SavePlaceSheet({ kind, onClose, onSaved }: Props) {
  const { countryCode } = useCountry();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      void searchAddressesAction(q, countryCode)
        .then((res) => setResults(res.results))
        .catch(() => setResults([]));
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, countryCode]);

  async function save(hit: AddressSuggestion) {
    const guest = getGuestProfile();
    if (!guest?.phone) {
      setError("Add your name and phone in Account first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/saved-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: guest.phone,
          label: kind,
          name: kind === "home" ? "Home" : "Work",
          address: hit.label,
          lat: hit.lat,
          lng: hit.lng,
          countryCode,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        place?: {
          id: string;
          name: string;
          label: string | null;
          latitude: number | null;
          longitude: number | null;
        };
      };
      if (!res.ok || !json.place) throw new Error("Could not save place");
      upsertSavedPlaceCache(guest.phone, {
        id: json.place.id,
        guest_phone: guest.phone,
        name: json.place.name,
        label: json.place.label,
        latitude: json.place.latitude,
        longitude: json.place.longitude,
        location_id: null,
        is_home: kind === "home",
        is_work: kind === "work",
        country_code: countryCode,
        created_at: new Date().toISOString(),
      });
      onSaved({
        type: "saved",
        id: json.place.id,
        label: kind,
        name: json.place.name,
        address: hit.label,
        lat: hit.lat,
        lng: hit.lng,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/40"
      role="dialog"
      aria-label={kind === "home" ? "Save home" : "Save work"}
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#DDDDDD]" />
        <h2 className="text-[20px] font-bold text-black">
          {kind === "home" ? "Where is home?" : "Where do you work?"}
        </h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a landmark or address"
          className="mt-4 min-h-12 w-full rounded-xl bg-[#F3F3F3] px-4 text-[16px] text-black outline-none"
          autoFocus
        />
        {error ? (
          <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
        ) : null}
        <div className="mt-3 max-h-[40vh] space-y-1 overflow-y-auto">
          {results.map((hit) => (
            <button
              key={hit.id}
              type="button"
              disabled={saving}
              onClick={() => void save(hit)}
              className="uber-press w-full rounded-xl px-4 py-3 text-left hover:bg-[#F3F3F3]"
            >
              <p className="truncate text-[15px] font-medium text-black">
                {hit.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
