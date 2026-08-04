"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Briefcase,
  ChevronLeft,
  Home,
  MapPin,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import { CopySocialCaption } from "@/components/wear/copy-social-caption";
import { describePlaceSocialCaption } from "@/lib/brand";
import {
  deleteSavedLocation,
  listSavedLocations,
  savePersonalLocation,
} from "@/lib/actions-locations";
import { LocationPinPicker } from "@/components/location/location-pin-picker";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import {
  enqueuePendingPlaceSave,
  readSavedPlacesCache,
  removeSavedPlaceCache,
  writeSavedPlacesCache,
} from "@/lib/saved-places-cache";
import type { SavedLocation } from "@/lib/types";

export default function SavedPlacesPage() {
  const { countryCode } = useCountry();
  const [places, setPlaces] = useState<SavedLocation[]>([]);
  const [guestPhone, setGuestPhone] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [directions, setDirections] = useState("");
  const [kind, setKind] = useState<"home" | "work" | "farm" | "custom">("custom");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reload(phone: string) {
    const cached = readSavedPlacesCache(phone);
    if (cached.length) setPlaces(cached);
    void listSavedLocations(phone)
      .then((rows) => {
        setPlaces(rows);
        writeSavedPlacesCache(phone, rows);
      })
      .catch(() => {
        if (!cached.length) setPlaces([]);
      });
  }

  useEffect(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) return;
    setGuestPhone(guest.phone);
    reload(guest.phone);
  }, []);

  const canSave =
    name.trim().length > 0 ||
    directions.trim().length >= 3 ||
    (lat != null && lng != null);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!guestPhone) {
      setError("Save your name & phone in Account first.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        const placeName =
          name.trim() ||
          (kind === "home"
            ? "Home"
            : kind === "work"
              ? "Work"
              : kind === "farm"
                ? "Farm"
                : "Place");
        const label =
          directions.trim() ||
          name.trim() ||
          placeName;
        const input = {
          guest_phone: guestPhone,
          name: placeName,
          label,
          latitude: lat,
          longitude: lng,
          is_home: kind === "home",
          is_work: kind === "work",
          is_farm: kind === "farm",
          country_code: countryCode,
        };
        let row;
        try {
          if (typeof navigator !== "undefined" && navigator.onLine === false) {
            row = enqueuePendingPlaceSave(input);
          } else {
            row = await savePersonalLocation(input);
          }
        } catch {
          row = enqueuePendingPlaceSave(input);
        }
        writeSavedPlacesCache(guestPhone, [
          row,
          ...readSavedPlacesCache(guestPhone).filter((p) => p.id !== row.id),
        ]);
        setAdding(false);
        setName("");
        setDirections("");
        setLat(null);
        setLng(null);
        setShowMap(false);
        setKind("custom");
        reload(guestPhone);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  function onDelete(id: string) {
    if (!guestPhone) return;
    start(async () => {
      await deleteSavedLocation(id, guestPhone);
      removeSavedPlaceCache(guestPhone, id);
      reload(guestPhone);
    });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6">
      <Link
        href="/account"
        className="uber-press inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-200"
      >
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-black">
        Saved places
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Home, Work, Farm — describe places in your own words. Works offline.
      </p>

      <div className="mt-4 rounded-2xl bg-black px-4 py-4 text-white">
        <p className="text-sm font-bold">Share: Describe Your Place</p>
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/85">
          {describePlaceSocialCaption()}
        </p>
        <CopySocialCaption caption={describePlaceSocialCaption()} />
      </div>

      {!guestPhone ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add your name and phone on{" "}
          <Link href="/account" className="font-bold underline">
            Account
          </Link>{" "}
          so we can save places to your profile.
        </p>
      ) : null}

      <ul className="mt-6 space-y-2">
        {places.length === 0 ? (
          <li className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate-500">
            No saved places yet
          </li>
        ) : (
          places.map((p) => {
            const Icon = p.is_home
              ? Home
              : p.is_work
                ? Briefcase
                : p.is_farm
                  ? Sprout
                  : MapPin;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#F9FAFB] px-4 py-3 shadow-sm"
              >
                <Icon className="h-5 w-5 text-[#000000]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.label || "Saved place"}
                    {p.latitude != null
                      ? ` · pin`
                      : " · description only"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })
        )}
      </ul>

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="uber-press uber-btn-black mt-6 flex w-full items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add new location
        </button>
      ) : (
        <form onSubmit={onSave} className="ru-card mt-6 space-y-3 p-4">
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["home", "Home"],
                ["work", "Work"],
                ["farm", "Farm"],
                ["custom", "Custom"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`uber-press rounded-full px-3 py-1.5 text-xs font-semibold ${
                  kind === k
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className="ru-input"
            placeholder={
              kind === "home"
                ? "Name (e.g. Home)"
                : kind === "work"
                  ? "Name (e.g. Work)"
                  : kind === "farm"
                    ? "Name (e.g. Farm)"
                    : "Name (e.g. Joe's House)"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="ru-input"
            placeholder="Address or landmark (e.g. 12 Main Rd — or green gate by mango tree)"
            value={directions}
            onChange={(e) => setDirections(e.target.value)}
          />
          {!showMap ? (
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="w-full rounded-xl border border-dashed border-gray-200 bg-[#fafafa] px-3 py-2.5 text-left text-xs font-semibold text-[#000000]"
            >
              Optional: pin on map
            </button>
          ) : (
            <div className="space-y-2">
              <LocationPinPicker
                lat={lat}
                lng={lng}
                onChange={(a, b) => {
                  setLat(a);
                  setLng(b);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setShowMap(false);
                  setLat(null);
                  setLng(null);
                }}
                className="text-xs font-semibold text-slate-500"
              >
                Skip map
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="uber-press uber-btn-soft w-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !canSave}
              className="uber-press uber-btn-black w-full"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
