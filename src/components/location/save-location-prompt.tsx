"use client";

import { useEffect, useState, useTransition } from "react";
import { savePersonalLocation } from "@/lib/actions-locations";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import {
  enqueuePendingPlaceSave,
  readSavedPlacesCache,
  writeSavedPlacesCache,
} from "@/lib/saved-places-cache";

type PlaceKind = "home" | "work" | "farm" | "custom";

type Props = {
  label: string;
  lat: number | null;
  lng: number | null;
};

/** Soft prompt after a landmark is set — works offline via local queue. */
export function SaveLocationPrompt({ label, lat, lng }: Props) {
  const { countryCode } = useCountry();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PlaceKind>("custom");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!label.trim()) {
      setVisible(false);
      return;
    }
    const key = `vr_save_prompt_${label.trim().toLowerCase()}`;
    try {
      if (sessionStorage.getItem(key) === "1") {
        setVisible(false);
        return;
      }
    } catch {
      /* ignore */
    }
    setVisible(true);
    setName("");
    setKind("custom");
    setDone(false);
  }, [label, lat, lng]);

  if (!visible || done) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(
        `vr_save_prompt_${label.trim().toLowerCase()}`,
        "1",
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function onSave() {
    const guest = getGuestProfile();
    if (!guest?.phone) {
      dismiss();
      return;
    }
    const placeName =
      name.trim() ||
      (kind === "home"
        ? "Home"
        : kind === "work"
          ? "Work"
          : kind === "farm"
            ? "Farm"
            : label.split("·")[0]?.trim() || "Saved place");

    const input = {
      guest_phone: guest.phone,
      name: placeName,
      label,
      latitude: lat,
      longitude: lng,
      is_home: kind === "home",
      is_work: kind === "work",
      is_farm: kind === "farm",
      country_code: countryCode,
    };

    start(async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          enqueuePendingPlaceSave(input);
          setDone(true);
          dismiss();
          return;
        }
        const row = await savePersonalLocation(input);
        writeSavedPlacesCache(guest.phone, [
          row,
          ...readSavedPlacesCache(guest.phone).filter((p) => p.id !== row.id),
        ]);
        setDone(true);
        dismiss();
      } catch {
        enqueuePendingPlaceSave(input);
        setDone(true);
        dismiss();
      }
    });
  }

  return (
    <div className="rounded-xl border border-[var(--ru-line)] bg-[#fafafa] px-3 py-3">
      <p className="text-sm font-semibold text-black">
        Save this description for next time?
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--ru-muted)]">
        Saved on this phone offline — syncs when you have signal.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(
          [
            ["home", "Home"],
            ["work", "Work"],
            ["farm", "Farm"],
            ["custom", "Custom"],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              kind === k ? "bg-black text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            {lab}
          </button>
        ))}
      </div>
      <input
        className="ru-input mt-2"
        placeholder="Name (e.g. Home, Farm)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="ru-btn ru-btn-secondary !min-h-9 flex-1 !text-xs"
        >
          Not now
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="ru-btn ru-btn-primary !min-h-9 flex-1 !text-xs"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
