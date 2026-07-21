"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, LocateFixed, MapPin, Plus, Search } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { AddLocationModal } from "@/components/location/add-location-modal";
import {
  bumpLocationUsage,
  searchCommunityLocations,
} from "@/lib/actions-locations";
import {
  findPlaceByLabel,
  provinceName,
  searchPlaces,
  type Place,
} from "@/lib/landmarks";
import { t } from "@/lib/i18n";
import type { CommunityLocation } from "@/lib/types";

export type PlaceValue = {
  label: string;
  lat: number | null;
  lng: number | null;
  locationId?: string | null;
};

export function emptyPlaceValue(): PlaceValue {
  return { label: "", lat: null, lng: null };
}

type Suggestion =
  | { source: "static"; place: Place }
  | { source: "community"; loc: CommunityLocation };

export function PlacesAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  showGps = false,
  preferVillages = false,
  allowAddMissing = true,
}: {
  label?: string;
  placeholder: string;
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  required?: boolean;
  showGps?: boolean;
  preferVillages?: boolean;
  allowAddMissing?: boolean;
}) {
  const { country, countryCode, locale } = useCountry();
  const [focused, setFocused] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [community, setCommunity] = useState<CommunityLocation[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [, startSearch] = useTransition();

  const staticSuggestions = useMemo(() => {
    const list = searchPlaces(value.label, preferVillages ? 10 : 8, countryCode);
    if (preferVillages && !value.label.trim()) {
      return list.filter((p) => p.kind === "village");
    }
    return list;
  }, [value.label, preferVillages, countryCode]);

  useEffect(() => {
    const q = value.label.trim();
    if (!focused) return;
    const t = window.setTimeout(() => {
      startSearch(() => {
        void searchCommunityLocations(q, countryCode, 6)
          .then(setCommunity)
          .catch(() => setCommunity([]));
      });
    }, 180);
    return () => window.clearTimeout(t);
  }, [value.label, countryCode, focused]);

  const suggestions: Suggestion[] = useMemo(() => {
    const staticIds = new Set(
      staticSuggestions.map((p) => p.label.toLowerCase()),
    );
    const fromCommunity: Suggestion[] = community
      .filter((loc) => {
        const label = `${loc.name} · ${loc.village}`.toLowerCase();
        return !staticIds.has(label) && !staticIds.has(loc.name.toLowerCase());
      })
      .map((loc) => ({ source: "community" as const, loc }));
    const fromStatic: Suggestion[] = staticSuggestions.map((place) => ({
      source: "static" as const,
      place,
    }));
    // Community (popular / user-added) first when querying
    if (value.label.trim()) {
      return [...fromCommunity, ...fromStatic].slice(0, 10);
    }
    return [...fromStatic, ...fromCommunity].slice(0, 10);
  }, [staticSuggestions, community, value.label]);

  const showEmptyAdd =
    allowAddMissing &&
    focused &&
    value.label.trim().length >= 2 &&
    suggestions.length === 0;

  const showList = focused && (suggestions.length > 0 || showEmptyAdd);

  function selectStatic(place: Place) {
    onChange({
      label: place.label,
      lat: place.lat,
      lng: place.lng,
    });
    setFocused(false);
  }

  function selectCommunity(loc: CommunityLocation) {
    onChange({
      label: `${loc.name} · ${loc.village}`,
      lat: loc.latitude,
      lng: loc.longitude,
      locationId: loc.id,
    });
    setFocused(false);
    void bumpLocationUsage(loc.id);
  }

  function onBlurCommit() {
    window.setTimeout(() => {
      setFocused(false);
      if (value.label.trim() && (value.lat == null || value.lng == null)) {
        const found = findPlaceByLabel(value.label, countryCode);
        if (found) {
          onChange({
            label: found.label,
            lat: found.lat,
            lng: found.lng,
          });
        }
      }
    }, 180);
  }

  function useGps() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("GPS not available — pick a place below.");
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
        setGpsError("Could not get GPS — select a place or add one.");
        setGpsLoading(false);
        setFocused(true);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const hintExample = country.landmarkHints[0] ?? "Near the clinic";

  return (
    <div className="relative">
      {label ? (
        <label className="mb-1 block text-sm font-semibold text-[#1A4D3A]">
          {label}
          {required ? " *" : ""}
        </label>
      ) : null}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={value.label}
            onChange={(e) =>
              onChange({ label: e.target.value, lat: null, lng: null })
            }
            onFocus={() => setFocused(true)}
            onBlur={onBlurCommit}
            placeholder={
              placeholder ||
              t("search_places", { locale, country: countryCode })
            }
            required={required}
            className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] py-3 pr-3 pl-10 text-sm outline-none focus:border-[#1A4D3A]"
            autoComplete="off"
          />
        </div>
        {showGps ? (
          <button
            type="button"
            onClick={useGps}
            disabled={gpsLoading}
            className="flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-[#1A4D3A] transition active:scale-95 disabled:opacity-50"
            aria-label="Use GPS"
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {country.flag} {country.name} — e.g. &ldquo;{hintExample}&rdquo;
      </p>
      {gpsError ? (
        <p className="mt-1 text-xs text-rose-600">{gpsError}</p>
      ) : null}
      {showList ? (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s) =>
            s.source === "static" ? (
              <li key={`s-${s.place.id}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#E8F5E9]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectStatic(s.place)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1A4D3A]" />
                  <span>
                    <span className="font-medium text-slate-900">
                      {s.place.label}
                    </span>
                    <span className="block text-xs text-slate-500 capitalize">
                      {s.place.kind === "village" ? "Town / area" : "Landmark"}
                      {s.place.province
                        ? ` · ${provinceName(s.place.province) || s.place.province}`
                        : ""}
                    </span>
                  </span>
                </button>
              </li>
            ) : (
              <li key={`c-${s.loc.id}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#E8F5E9]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCommunity(s.loc)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1A4D3A]" />
                  <span className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                      {s.loc.name}
                      {s.loc.is_verified ? (
                        <Check
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-label="Verified"
                        />
                      ) : null}
                    </span>
                    <span className="block text-xs text-slate-500 capitalize">
                      {s.loc.category} · {s.loc.village}
                      {s.loc.is_verified
                        ? " · Verified"
                        : " · Suggested by user"}
                    </span>
                  </span>
                </button>
              </li>
            ),
          )}
          {(showEmptyAdd ||
            (allowAddMissing &&
              focused &&
              value.label.trim().length >= 2)) && (
            <li className="border-t border-gray-100">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold text-[#1A4D3A] hover:bg-[#E8F5E9]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setFocused(false);
                  setAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {suggestions.length === 0
                  ? "Didn't find it? Add missing location"
                  : "Add missing location"}
              </button>
            </li>
          )}
        </ul>
      ) : null}

      {addOpen ? (
        <AddLocationModal
          initialName={value.label}
          onClose={() => setAddOpen(false)}
          onCreated={(place) => {
            onChange(place);
            setAddOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
