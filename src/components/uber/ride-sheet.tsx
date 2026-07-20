"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckoutBlock } from "@/components/uber/checkout-block";
import {
  GpsButton,
  LandmarkField,
  LandmarkHelperText,
  type Loc,
} from "@/components/uber/landmark-field";
import {
  ScheduleWhen,
  defaultLaterLocal,
  localInputToIso,
  type WhenMode,
} from "@/components/uber/schedule-when";
import { quoteFareAction } from "@/lib/actions";
import { locsFromSearchParams } from "@/lib/booking-query";
import { useCountry } from "@/components/country/country-provider";
import type { VehicleType } from "@/lib/types";

export function RideSheet({
  onPinChange,
}: {
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
}) {
  const { countryCode, country } = useCountry();
  const searchParams = useSearchParams();
  const initial = locsFromSearchParams(searchParams);
  const [pickup, setPickup] = useState<Loc>(initial.pickup);
  const [dropoff, setDropoff] = useState<Loc>(initial.dropoff);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [fee, setFee] = useState(country.pricing.ride.base);
  const [baseFee, setBaseFee] = useState(country.pricing.ride.base);
  const [isNight, setIsNight] = useState(false);
  const [nightExtra, setNightExtra] = useState(0);
  const [currency, setCurrency] = useState(country.currency);

  const atIso = useMemo(
    () =>
      whenMode === "later" ? localInputToIso(scheduledLocal) : null,
    [whenMode, scheduledLocal],
  );

  useEffect(() => {
    onPinChange?.(
      pickup.lat != null && pickup.lng != null
        ? { lat: pickup.lat, lng: pickup.lng }
        : null,
    );
  }, [pickup.lat, pickup.lng, onPinChange]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fare = await quoteFareAction({
          vehicle,
          service_type: "ride",
          country_code: countryCode,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          at: atIso,
        });
        if (!cancelled) {
          setFee(fare.fee_amount);
          setBaseFee(fare.base_fee_amount);
          setIsNight(fare.is_night_ride);
          setNightExtra(fare.night_surcharge_amount);
          setCurrency(fare.currency);
        }
      } catch {
        /* keep */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicle, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, atIso, countryCode]);

  const ready =
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    (whenMode === "now" || Boolean(atIso));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1A4D3A]">Village Ride</h1>
        <p className="text-sm text-slate-600">
          Direct village-to-village — when taxis stop or won&apos;t go. Night &amp;
          scheduled rides welcome.
        </p>
      </div>

      <Link
        href="/delivery"
        className="block rounded-xl border border-[#1A4D3A]/20 bg-[#E8F5E9] px-3 py-2.5 text-sm text-[#1A4D3A] transition hover:bg-[#d7ecd9]"
      >
        Moving goods?{" "}
        <span className="font-bold underline">Switch to Village Delivery</span>{" "}
        for unrestricted town &amp; village transport!
      </Link>

      <ScheduleWhen
        mode={whenMode}
        onModeChange={setWhenMode}
        scheduledLocal={scheduledLocal}
        onScheduledLocalChange={setScheduledLocal}
        nowLabel="Ride Now"
      />

      <GpsButton
        onPin={(coords) =>
          setPickup((p) => ({
            ...p,
            ...coords,
            landmark: p.landmark.trim() || "Current location",
          }))
        }
      />

      <LandmarkField
        label="Pickup (village or landmark)"
        placeholder="e.g., Soweto · Main taxi rank"
        loc={pickup}
        onChange={setPickup}
        preferVillages
      />
      <LandmarkField
        label="Dropoff (village or landmark)"
        placeholder="e.g., Mthatha · Clinic"
        loc={dropoff}
        onChange={setDropoff}
      />
      <LandmarkHelperText />

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Your name
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Phone
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06…"
            required
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1A4D3A]">Passengers</p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-xl font-bold text-[#1A4D3A]"
            onClick={() => setPassengers((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span className="min-w-8 text-center text-xl font-bold text-[#1A4D3A]">
            {passengers}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-xl font-bold text-[#1A4D3A]"
            onClick={() => setPassengers((n) => Math.min(6, n + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1A4D3A]">Vehicle type</p>
        <div className="mt-2 space-y-2">
          {(
            [
              {
                id: "sedan" as const,
                label: "Car (up to 4 people)",
                from: country.pricing.ride.base,
              },
              {
                id: "bakkie" as const,
                label: "Bakkie (up to 6 people)",
                from: country.pricing.delivery.base,
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVehicle(opt.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                vehicle === opt.id
                  ? "border-[#1A4D3A] bg-[#E8F5E9]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-semibold text-[#1A4D3A]">
                {opt.label}
              </span>
              <span className="text-sm text-slate-600">
                from {country.currencySymbol}
                {opt.from}
              </span>
            </button>
          ))}
        </div>
      </div>

      <CheckoutBlock
        fee={fee}
        currency={currency}
        vehicle={vehicle}
        ready={ready}
        serviceType="ride"
        isNightRide={isNight}
        baseFee={baseFee}
        nightSurchargeAmount={nightExtra}
        buttonLabel="Request Ride"
        description={`Village Ride · ${vehicle}${isNight ? " · Night" : ""}`}
        draft={() => ({
          service_type: "ride",
          required_vehicle: vehicle,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          pickup_landmark: pickup.landmark.trim(),
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          dropoff_landmark: dropoff.landmark.trim(),
          scheduled_for: atIso,
          country_code: countryCode,
          dispatcher_notes: isNight
            ? "Night Ride (Premium) — after-hours safety surcharge applied"
            : null,
          details: {
            seats: passengers,
            route_name: `${pickup.landmark} → ${dropoff.landmark}`,
            direction: "to_village" as const,
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
