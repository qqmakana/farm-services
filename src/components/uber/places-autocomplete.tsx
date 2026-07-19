"use client";

import { useMemo, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import {
  findPlaceByLabel,
  provinceName,
  searchPlaces,
  type Place,
} from "@/lib/landmarks";

export type PlaceValue = {
  label: string;
  lat: number | null;
  lng: number | null;
};

export function emptyPlaceValue(): PlaceValue {
  return { label: "", lat: null, lng: null };
}

export function PlacesAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  showGps = false,
  preferVillages = false,
}: {
  label?: string;
  placeholder: string;
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  required?: boolean;
  showGps?: boolean;
  /** When true, empty query lists villages (manual start). */
  preferVillages?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const suggestions = useMemo(() => {
    const list = searchPlaces(value.label, preferVillages ? 10 : 8);
    if (preferVillages && !value.label.trim()) {
      return list.filter((p) => p.kind === "village");
    }
    return list;
  }, [value.label, preferVillages]);

  function selectPlace(place: Place) {
    onChange({
      label: place.label,
      lat: place.lat,
      lng: place.lng,
    });
    setFocused(false);
  }

  function onBlurCommit() {
    window.setTimeout(() => {
      setFocused(false);
      // If typed text matches a known place, attach coords
      if (value.label.trim() && (value.lat == null || value.lng == null)) {
        const found = findPlaceByLabel(value.label);
        if (found) {
          onChange({
            label: found.label,
            lat: found.lat,
            lng: found.lng,
          });
        }
      }
    }, 150);
  }

  function useGps() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("GPS not available — pick a village below.");
      setFocused(true);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          label: value.label.trim() || "Current location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        setGpsError("Could not get GPS — select your starting village.");
        setGpsLoading(false);
        setFocused(true);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="relative space-y-2">
      {label ? (
        <p className="text-sm font-semibold text-[#1A4D3A]">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </p>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-[#F9FAFB] px-3 py-3 shadow-sm focus-within:border-[#1A4D3A] focus-within:ring-2 focus-within:ring-[#1A4D3A]/15">
        <Search className="h-5 w-5 shrink-0 text-[#1A4D3A]" aria-hidden />
        <input
          required={required}
          className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={placeholder}
          value={value.label}
          onChange={(e) =>
            onChange({ label: e.target.value, lat: null, lng: null })
          }
          onFocus={() => setFocused(true)}
          onBlur={onBlurCommit}
          autoComplete="off"
        />
      </div>

      {showGps ? (
        <button
          type="button"
          onClick={useGps}
          disabled={gpsLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1A4D3A]/20 bg-[#E8F5E9] px-3 py-2.5 text-sm font-semibold text-[#1A4D3A] transition active:scale-95 disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          {gpsLoading ? "Getting location…" : "Use my current location"}
        </button>
      ) : null}

      {gpsError ? (
        <p className="text-xs text-amber-800">{gpsError}</p>
      ) : null}

      {value.lat != null && value.lng != null ? (
        <p className="text-xs text-emerald-800">
          Pin set · {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Search anywhere in South Africa — town, village or landmark — or use GPS.
        </p>
      )}

      {focused ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-md">
          {suggestions.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-slate-500">
              No matches — you can still type a custom landmark.
            </li>
          ) : (
            suggestions.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition active:scale-[0.99] hover:bg-[#E8F5E9]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPlace(p)}
                >
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#1A4D3A]"
                    aria-hidden
                  />
                  <span>
                    <span className="block font-medium text-slate-900">
                      {p.label}
                    </span>
                    <span className="block text-xs text-slate-500 capitalize">
                      {p.kind === "village" ? "Town / area" : "Landmark"}
                      {p.province ? ` · ${provinceName(p.province)}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
