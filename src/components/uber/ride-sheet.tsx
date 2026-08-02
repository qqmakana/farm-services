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
import { PickupPhotoField } from "@/components/location/pickup-photo-field";
import { RiderPhotoField } from "@/components/rider/rider-photo-field";
import { SaveLocationPrompt } from "@/components/location/save-location-prompt";
import { compressPickupPhotoDataUrl } from "@/lib/pickup-photo";
import { getGuestProfile } from "@/lib/guest-profile";
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
  const [wearing, setWearing] = useState("");
  const [pickupPhoto, setPickupPhoto] = useState<File | null>(null);
  const [riderPhotoPreview, setRiderPhotoPreview] = useState<string | null>(
    null,
  );
  const [passengers, setPassengers] = useState(1);
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [localModeId, setLocalModeId] = useState<string | null>(null);
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [fee, setFee] = useState(country.pricing.ride.base);
  const [baseFee, setBaseFee] = useState(country.pricing.ride.base);
  const [isNight, setIsNight] = useState(false);
  const [nightExtra, setNightExtra] = useState(0);
  const [currency, setCurrency] = useState(country.currency);

  useEffect(() => {
    const guest = getGuestProfile();
    if (guest?.photo_data_url) setRiderPhotoPreview(guest.photo_data_url);
    if (guest?.name) setName((n) => n || guest.name);
    if (guest?.phone) setPhone((p) => p || guest.phone);
  }, []);

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
        <h1 className="text-xl font-bold text-[#000000]">Village Ride</h1>
        <p className="text-sm text-slate-600">
          Villages, towns &amp; cities — book with a street address or a landmark.
          Night &amp; scheduled rides welcome.
        </p>
      </div>

      <Link
        href="/delivery"
        className="block rounded-xl border border-[#000000]/20 bg-[#f5f5f5] px-3 py-2.5 text-sm text-[#000000] transition hover:bg-[#f5f5f5]"
      >
        Moving goods?{" "}
        <span className="font-bold underline">Switch to Village Delivery</span>{" "}
        for town, village &amp; city transport.
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
        label="Pickup location (address or landmark)"
        placeholder="e.g., 12 Main Rd, Sandton — or green gate by the mango tree"
        loc={pickup}
        onChange={setPickup}
        showExamples
      />
      {pickup.landmark.trim() ? (
        <SaveLocationPrompt
          label={pickup.landmark}
          lat={pickup.lat}
          lng={pickup.lng}
        />
      ) : null}
      <PickupPhotoField file={pickupPhoto} onChange={setPickupPhoto} />
      <LandmarkField
        label="Dropoff location (address or landmark)"
        placeholder="e.g., Shoprite parking — or blue house after the church"
        loc={dropoff}
        onChange={setDropoff}
      />
      {dropoff.landmark.trim() ? (
        <SaveLocationPrompt
          label={dropoff.landmark}
          lat={dropoff.lat}
          lng={dropoff.lng}
        />
      ) : null}
      <LandmarkHelperText />

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#000000]">
          Your name
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold text-[#000000]">
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

      <label className="block text-sm font-semibold text-[#000000]">
        What are you wearing?{" "}
        <span className="font-normal text-slate-500">(optional)</span>
        <input
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          value={wearing}
          onChange={(e) => setWearing(e.target.value)}
          placeholder="e.g., Nike tracksuit, red jacket"
          maxLength={120}
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Helps your driver spot you at the landmark.
        </span>
      </label>

      <RiderPhotoField
        compact
        previewUrl={riderPhotoPreview}
        name={name}
        phone={phone}
        countryCode={countryCode}
        onChange={setRiderPhotoPreview}
      />

      <div>
        <p className="text-sm font-semibold text-[#000000]">Passengers</p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f5] text-xl font-bold text-[#000000]"
            onClick={() => setPassengers((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span className="min-w-8 text-center text-xl font-bold text-[#000000]">
            {passengers}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f5] text-xl font-bold text-[#000000]"
            onClick={() => setPassengers((n) => Math.min(6, n + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[#000000]">Vehicle type</p>
        <div className="mt-2 space-y-2">
          {(
            [
              {
                id: "sedan" as VehicleType,
                label: "Car (up to 4 people)",
                from: country.pricing.ride.base,
                modeId: null as string | null,
              },
              {
                id: "bakkie" as VehicleType,
                label: "Bakkie / pickup (up to 6 people)",
                from: country.pricing.delivery.base,
                modeId: null as string | null,
              },
              ...country.localRideModes.map((m) => ({
                id: "motorcycle" as VehicleType,
                label: m.label,
                from: country.pricing.motorcycle.base,
                modeId: m.id as string,
              })),
            ]
          ).map((opt) => (
            <button
              key={`${opt.id}-${opt.modeId ?? opt.label}`}
              type="button"
              onClick={() => {
                setVehicle(opt.id);
                setLocalModeId(opt.modeId);
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                vehicle === opt.id && localModeId === opt.modeId
                  ? "border-[#000000] bg-[#f5f5f5]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-semibold text-[#000000]">
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
        description={`Village Ride · ${
          localModeId
            ? country.localRideModes.find((m) => m.id === localModeId)?.label ??
              vehicle
            : vehicle
        }${isNight ? " · Night" : ""}`}
        draft={async () => {
          const photoDataUrl = pickupPhoto
            ? await compressPickupPhotoDataUrl(pickupPhoto)
            : null;
          const guestPhoto =
            riderPhotoPreview || getGuestProfile()?.photo_data_url || null;
          const guestPath = getGuestProfile()?.photo_url || null;
          return {
            service_type: "ride" as const,
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
              ...(localModeId ? { local_mode: localModeId } : {}),
              ...(wearing.trim() ? { wearing: wearing.trim() } : {}),
              ...(photoDataUrl
                ? { pickup_photo_data_url: photoDataUrl }
                : {}),
              ...(guestPhoto
                ? { rider_photo_data_url: guestPhoto }
                : {}),
              ...(guestPath && !guestPath.startsWith("mock://")
                ? { rider_photo_url: guestPath }
                : {}),
            },
            fee_amount: fee,
          };
        }}
      />
    </div>
  );
}
