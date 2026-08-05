"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { updateDriverHomeCity } from "@/lib/actions-founding-bonus";
import {
  FOUNDING_CITIES,
  daysLeftInFoundingEra,
  isWithinFoundingEra,
} from "@/lib/founding-driver";
import { useDriverApp } from "@/components/driver/driver-app-provider";

/** Dashboard banner for Founding Driver Bonus Pool (performance incentive). */
export function FoundingBanner() {
  const { driver, refresh } = useDriverApp();
  const [daysLeft, setDaysLeft] = useState(0);
  const [openEra, setOpenEra] = useState(false);
  const [city, setCity] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDaysLeft(daysLeftInFoundingEra());
    setOpenEra(isWithinFoundingEra());
  }, []);

  useEffect(() => {
    if (driver?.home_city) setCity(driver.home_city);
  }, [driver?.home_city]);

  if (!driver) return null;

  const isFounding = Boolean(driver.is_founding_driver);
  const homeCity = driver.home_city || city || "your city";

  function saveCity() {
    if (!driver?.id || !city) return;
    setError(null);
    start(async () => {
      try {
        await updateDriverHomeCity(driver.id, city);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save city");
      }
    });
  }

  if (isFounding) {
    return (
      <div
        data-testid="founding-banner-active"
        className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-3 text-black shadow-sm"
      >
        <p className="text-sm font-bold">Founding Driver status active</p>
        <p className="mt-0.5 text-xs font-medium text-black/80">
          You are earning from the {homeCity} monthly bonus pool.
        </p>
        <Link
          href="/driver/earnings"
          className="mt-2 inline-block text-xs font-bold underline underline-offset-2"
        >
          View bonus pool
        </Link>
      </div>
    );
  }

  if (!openEra) return null;

  return (
    <div
      data-testid="founding-banner-open"
      className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-black shadow-sm"
    >
      <p className="text-sm font-bold">
        Founding Era: {daysLeft} day{daysLeft === 1 ? "" : "s"} left
      </p>
      <p className="mt-0.5 text-xs font-medium text-black/85">
        Complete your first trip in {homeCity === "your city" ? "your city" : homeCity}{" "}
        to lock in your Bonus Pool status.
      </p>

      {!driver.home_city ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            className="min-h-10 flex-1 rounded-xl border-0 bg-white/90 px-3 text-sm font-semibold text-black"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Home city"
          >
            <option value="">Select home city</option>
            {FOUNDING_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !city}
            onClick={saveCity}
            className="uber-press rounded-xl bg-black px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs font-semibold text-rose-900">{error}</p> : null}
    </div>
  );
}
