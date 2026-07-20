"use client";

import { useMemo, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import {
  findPlaceByLabel,
  provinceName,
  searchPlaces,
  type Place,
} from "@/lib/landmarks";
import { t } from "@/lib/i18n";

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
  preferVillages?: boolean;
}) {
  const { country, countryCode, locale } = useCountry();
  const [focused, setFocused] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const suggestions = useMemo(() => {
    const list = searchPlaces(value.label, preferVillages ? 10 : 8, countryCode);
    if (preferVillages && !value.label.trim()) {
      return list.filter((p) => p.kind === "village");
    }
    return list;
  }, [value.label, preferVillages, countryCode]);

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

  const showList = focused && suggestions.length > 0;
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
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {suggestions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#E8F5E9]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPlace(p)}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1A4D3A]" />
                <span>
                  <span className="font-medium text-slate-900">{p.label}</span>
                  <span className="block text-xs text-slate-500 capitalize">
                    {p.kind === "village" ? "Town / area" : "Landmark"}
                    {p.province
                      ? ` · ${provinceName(p.province) || p.province}`
                      : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
