"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Briefcase,
  ChevronLeft,
  Home,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import {
  deleteSavedLocation,
  listSavedLocations,
  savePersonalLocation,
} from "@/lib/actions-locations";
import { LocationPinPicker } from "@/components/location/location-pin-picker";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import type { SavedLocation } from "@/lib/types";

export default function SavedPlacesPage() {
  const { countryCode } = useCountry();
  const [places, setPlaces] = useState<SavedLocation[]>([]);
  const [guestPhone, setGuestPhone] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"home" | "work" | "custom">("custom");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reload(phone: string) {
    void listSavedLocations(phone)
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }

  useEffect(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) return;
    setGuestPhone(guest.phone);
    reload(guest.phone);
  }, []);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!guestPhone) {
      setError("Save your name & phone in Account first.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await savePersonalLocation({
          guest_phone: guestPhone,
          name: name.trim() || (kind === "home" ? "Home" : kind === "work" ? "Work" : "Place"),
          label: name.trim() || undefined,
          latitude: lat!,
          longitude: lng!,
          is_home: kind === "home",
          is_work: kind === "work",
          country_code: countryCode,
        });
        setAdding(false);
        setName("");
        setLat(null);
        setLng(null);
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
      reload(guestPhone);
    });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-24 pt-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A4D3A] transition active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
        Saved Places
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Pin Home, Work, and places you use often — they show up when booking.
      </p>

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
            const Icon = p.is_home ? Home : p.is_work ? Briefcase : MapPin;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#F9FAFB] px-4 py-3 shadow-sm"
              >
                <Icon className="h-5 w-5 text-[#1A4D3A]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.label || "Saved place"}
                    {p.latitude != null
                      ? ` · ${p.latitude.toFixed(3)}, ${p.longitude?.toFixed(3)}`
                      : ""}
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
          className="ru-btn ru-btn-primary ru-btn-block mt-6 inline-flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add new location
        </button>
      ) : (
        <form
          onSubmit={onSave}
          className="ru-card mt-6 space-y-3 p-4"
        >
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
                ["custom", "Custom"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  kind === k ? "bg-black text-white" : "bg-slate-100 text-slate-700"
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
                ? "Home (e.g. Qunu)"
                : kind === "work"
                  ? "Work (e.g. my shop)"
                  : "Name (e.g. Joe's House)"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <LocationPinPicker
            lat={lat}
            lng={lng}
            onChange={(a, b) => {
              setLat(a);
              setLng(b);
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="ru-btn ru-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || lat == null || lng == null}
              className="ru-btn ru-btn-primary"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
