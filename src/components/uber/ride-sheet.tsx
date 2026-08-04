"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Car, Check, Truck, User, Motorbike } from "lucide-react";
import { CheckoutBlock } from "@/components/uber/checkout-block";
import {
  GpsButton,
  LandmarkField,
  LandmarkHelperText,
  type Loc,
} from "@/components/uber/landmark-field";
import { WhereToBar } from "@/components/uber/where-to-bar";
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
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { formatMoney } from "@/lib/format";
import type { VehicleType } from "@/lib/types";
import { FareBreakdownCard } from "@/components/uber/fare-breakdown-card";

export function RideSheet({
  onPinChange,
  onDropoffPinChange,
  mapTapPin = null,
  mapTapToken = 0,
}: {
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
  onDropoffPinChange?: (pin: { lat: number; lng: number } | null) => void;
  /** Latest map tap — keeps landmark text; does not replace it. */
  mapTapPin?: { lat: number; lng: number } | null;
  mapTapToken?: number;
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
  const [whenMode, setWhenMode] = useState<WhenMode>(() =>
    searchParams.get("when") === "later" ? "later" : "now",
  );
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [fee, setFee] = useState(country.pricing.ride.base);
  const [baseFee, setBaseFee] = useState(country.pricing.ride.base);
  const [distanceFare, setDistanceFare] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [bookingFee, setBookingFee] = useState(5);
  const [villagePass, setVillagePass] = useState(false);
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
    onDropoffPinChange?.(
      dropoff.lat != null && dropoff.lng != null
        ? { lat: dropoff.lat, lng: dropoff.lng }
        : null,
    );
  }, [dropoff.lat, dropoff.lng, onDropoffPinChange]);

  // Auto-GPS or map tap → show pin on map; keep typed landmark text
  useEffect(() => {
    if (!mapTapPin || !mapTapToken) return;
    setPickup((p) => {
      // Deep-link / search already gave coords — don't jump away on first GPS
      if (mapTapToken === 1 && p.lat != null && p.lng != null) return p;
      return {
        ...p,
        lat: mapTapPin.lat,
        lng: mapTapPin.lng,
        landmark: p.landmark.trim() || "Current location",
      };
    });
  }, [mapTapPin, mapTapToken]);

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
          customer_phone: phone || getGuestProfile()?.phone || null,
        });
        if (!cancelled) {
          setFee(fare.fee_amount);
          setBaseFee(fare.base_fee_amount);
          setDistanceFare(fare.distance_fare);
          setDistanceKm(fare.distance_km);
          setBookingFee(fare.booking_fee);
          setVillagePass(fare.village_pass);
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
  }, [vehicle, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, atIso, countryCode, phone]);

  const ready =
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    (whenMode === "now" || Boolean(atIso));

  const vehicleOptions = (
    [
      {
        id: "sedan" as VehicleType,
        label: "Village Ride",
        capacity: 4,
        from: country.pricing.ride.base,
        modeId: null as string | null,
        Icon: Car,
        eta: "Few min",
      },
      {
        id: "bakkie" as VehicleType,
        label: "Bakkie / pickup",
        capacity: 6,
        from: country.pricing.delivery.base,
        modeId: null as string | null,
        Icon: Truck,
        eta: "Few min",
      },
      ...country.localRideModes.map((m) => ({
        id: "motorcycle" as VehicleType,
        label: m.label,
        capacity: 1,
        from: country.pricing.motorcycle.base,
        modeId: m.id as string,
        Icon: Motorbike,
        eta: "Quick",
      })),
    ]
  );

  return (
    <div className="space-y-4">
      <WhereToBar
        pickupSlot={
          <LandmarkField
            compact
            showSaved={false}
            label="Pickup"
            placeholder="Current location"
            loc={pickup}
            onChange={setPickup}
          />
        }
        dropoffSlot={
          <LandmarkField
            compact
            showSaved={false}
            showGps={false}
            label="Dropoff"
            placeholder="Where to?"
            loc={dropoff}
            onChange={setDropoff}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <GpsButton
          onPin={(coords) =>
            setPickup((p) => ({
              ...p,
              ...coords,
              landmark: p.landmark.trim() || "Current location",
            }))
          }
        />
        <Link
          href="/delivery"
          className="text-xs font-semibold text-gray-500 underline underline-offset-2"
        >
          Moving goods? Delivery
        </Link>
      </div>

      <ScheduleWhen
        mode={whenMode}
        onModeChange={setWhenMode}
        scheduledLocal={scheduledLocal}
        onScheduledLocalChange={setScheduledLocal}
        nowLabel="Ride Now"
      />

      {pickup.landmark.trim() ? (
        <SaveLocationPrompt
          label={pickup.landmark}
          lat={pickup.lat}
          lng={pickup.lng}
        />
      ) : null}
      <PickupPhotoField file={pickupPhoto} onChange={setPickupPhoto} />
      {dropoff.landmark.trim() ? (
        <SaveLocationPrompt
          label={dropoff.landmark}
          lat={dropoff.lat}
          lng={dropoff.lng}
        />
      ) : null}
      <LandmarkHelperText />

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[var(--ru-ink)]">
          Your name
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--ru-ink)]">
          Phone
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={formatPhonePlaceholder(countryCode)}
            inputMode="tel"
            required
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-[var(--ru-ink)]">
        What are you wearing?{" "}
        <span className="font-normal text-gray-500">(optional)</span>
        <input
          className="ru-soft-field mt-1.5 text-sm"
          value={wearing}
          onChange={(e) => setWearing(e.target.value)}
          placeholder="e.g., Nike tracksuit, red jacket"
          maxLength={120}
        />
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
        <p className="text-sm font-semibold text-[var(--ru-ink)]">Passengers</p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-[var(--ru-ink)] transition active:scale-[0.98]"
            onClick={() => setPassengers((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span className="min-w-8 text-center text-xl font-bold text-[var(--ru-ink)]">
            {passengers}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-[var(--ru-ink)] transition active:scale-[0.98]"
            onClick={() => setPassengers((n) => Math.min(6, n + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-bold tracking-wide text-gray-500 uppercase">
          Choose a ride
        </p>
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          {vehicleOptions.map((opt) => {
            const selected =
              vehicle === opt.id && localModeId === opt.modeId;
            const Icon = opt.Icon;
            const showPrice =
              vehicle === opt.id && localModeId === opt.modeId
                ? fee
                : opt.from;
            return (
              <button
                key={`${opt.id}-${opt.modeId ?? opt.label}`}
                type="button"
                onClick={() => {
                  setVehicle(opt.id);
                  setLocalModeId(opt.modeId);
                }}
                className={`flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-gray-50 active:scale-[0.99] ${
                  selected ? "bg-gray-50 ring-2 ring-inset ring-black" : "bg-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[var(--ru-ink)]">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ru-ink)]">
                      {opt.label}
                      <span className="inline-flex items-center gap-0.5 text-xs font-normal text-gray-500">
                        <User className="h-3 w-3" aria-hidden />
                        {opt.capacity}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {opt.eta} away
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {selected ? (
                    <Check className="h-4 w-4 text-[var(--ru-ink)]" aria-hidden />
                  ) : (
                    <span className="h-4" />
                  )}
                  <span className="text-sm font-bold text-[var(--ru-ink)]">
                    {formatMoney(showPrice, currency, countryCode)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <FareBreakdownCard
        baseFare={baseFee}
        distanceFare={distanceFare + nightExtra}
        platformFee={bookingFee}
        total={fee}
        currency={currency}
        villagePass={villagePass}
        distanceKm={distanceKm}
      />

      <CheckoutBlock
        fee={fee}
        currency={currency}
        vehicle={vehicle}
        ready={ready}
        serviceType="ride"
        isNightRide={isNight}
        baseFee={baseFee}
        nightSurchargeAmount={nightExtra}
        buttonLabel="Choose Village Ride"
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
