"use client";

import { useEffect, useState, useTransition } from "react";
import { savePersonalLocation } from "@/lib/actions-locations";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";

type Props = {
  label: string;
  lat: number | null;
  lng: number | null;
};

/** Soft prompt after a booking destination is set. */
export function SaveLocationPrompt({ label, lat, lng }: Props) {
  const { countryCode } = useCountry();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!label.trim() || lat == null || lng == null) {
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
    start(async () => {
      try {
        await savePersonalLocation({
          guest_phone: guest.phone,
          name: name.trim() || label.split("·")[0]?.trim() || "Saved place",
          label,
          latitude: lat!,
          longitude: lng!,
          country_code: countryCode,
        });
        setDone(true);
        dismiss();
      } catch {
        dismiss();
      }
    });
  }

  return (
    <div className="rounded-xl border border-[var(--ru-line)] bg-[#fafafa] px-3 py-3">
      <p className="text-sm font-semibold text-black">
        Save this location for next time?
      </p>
      <input
        className="ru-input mt-2"
        placeholder="Name (e.g. Home, Market)"
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
