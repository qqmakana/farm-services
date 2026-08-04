"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Clock, LocateFixed, User } from "lucide-react";
import { CheckoutBlock } from "@/components/uber/checkout-block";
import {
  LandmarkField,
  type Loc,
} from "@/components/uber/landmark-field";
import { WhereToBar } from "@/components/uber/where-to-bar";
import { PickupPhotoField } from "@/components/location/pickup-photo-field";
import { RiderPhotoField } from "@/components/rider/rider-photo-field";
import { compressPickupPhotoDataUrl } from "@/lib/pickup-photo";
import { getGuestProfile } from "@/lib/guest-profile";
import {
  defaultLaterLocal,
  localInputToIso,
  toLocalInputValue,
  type WhenMode,
} from "@/components/uber/schedule-when";
import { quoteFareAction } from "@/lib/actions";
import { locsFromSearchParams } from "@/lib/booking-query";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { formatMoney } from "@/lib/format";
import type { VehicleType } from "@/lib/types";

/**
 * Uber-style Ride sheet: Where to? → Choose a ride (photos) → Confirm.
 * Extra Village Ride fields live under “More options”.
 */
export function RideSheet({
  onPinChange,
  onDropoffPinChange,
  mapTapPin = null,
  mapTapToken = 0,
}: {
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
  onDropoffPinChange?: (pin: { lat: number; lng: number } | null) => void;
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
  const [isNight, setIsNight] = useState(false);
  const [nightExtra, setNightExtra] = useState(0);
  const [currency, setCurrency] = useState(country.currency);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const guest = getGuestProfile();
    if (guest?.photo_data_url) setRiderPhotoPreview(guest.photo_data_url);
    if (guest?.name) setName((n) => n || guest.name);
    if (guest?.phone) setPhone((p) => p || guest.phone);
  }, []);

  const atIso = useMemo(
    () => (whenMode === "later" ? localInputToIso(scheduledLocal) : null),
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

  useEffect(() => {
    if (!mapTapPin || !mapTapToken) return;
    setPickup((p) => {
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
  }, [
    vehicle,
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    atIso,
    countryCode,
    phone,
  ]);

  const needsContact = !name.trim() || !phone.trim();

  const ready =
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    (whenMode === "now" || Boolean(atIso));

  const selectedLabel = useMemo(() => {
    if (localModeId) {
      return (
        country.localRideModes.find((m) => m.id === localModeId)?.label ??
        "Ride"
      );
    }
    if (vehicle === "bakkie") return "Bakkie";
    return "Village Ride";
  }, [country.localRideModes, localModeId, vehicle]);

  const vehicleOptions = [
    {
      id: "sedan" as VehicleType,
      label: "Village Ride",
      capacity: 4,
      from: country.pricing.ride.base,
      modeId: null as string | null,
      image: "/home/sug-ride.jpg",
      eta: "Few min",
    },
    {
      id: "bakkie" as VehicleType,
      label: "Bakkie",
      capacity: 6,
      from: country.pricing.delivery.base,
      modeId: null as string | null,
      image: "/home/sug-farm.jpg",
      eta: "Few min",
    },
    ...country.localRideModes.map((m) => ({
      id: "motorcycle" as VehicleType,
      label: m.label,
      capacity: 1,
      from: country.pricing.motorcycle.base,
      modeId: m.id as string,
      image: "/home/sug-courier.jpg",
      eta: "Quick",
    })),
  ];

  function refreshGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickup((p) => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          landmark: p.landmark.trim() || "Current location",
        }));
      },
      () => {
        /* ignore */
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="space-y-3 touch-manipulation">
      <WhereToBar
        pickupSlot={
          <LandmarkField
            compact
            showSaved={false}
            showGps={false}
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

      {/* Uber-style Now / Later + GPS row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setWhenMode("now")}
          className={`uber-press rounded-full px-3.5 py-2 text-sm font-semibold ${
            whenMode === "now"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Now
        </button>
        <button
          type="button"
          onClick={() => setWhenMode("later")}
          className={`uber-press inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
            whenMode === "later"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Later
        </button>
        <button
          type="button"
          onClick={refreshGps}
          className="uber-press ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-black hover:bg-gray-200"
          aria-label="Use my location"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      {whenMode === "later" ? (
        <input
          type="datetime-local"
          className="ru-soft-field text-sm"
          value={scheduledLocal}
          min={toLocalInputValue(new Date())}
          onChange={(e) => setScheduledLocal(e.target.value)}
        />
      ) : null}

      {/* Choose a ride — Uber product list with photos */}
      <div>
        <p className="mb-1 text-base font-bold tracking-tight text-black">
          Choose a ride
        </p>
        <ul className="-mx-1">
          {vehicleOptions.map((opt) => {
            const selected =
              vehicle === opt.id && localModeId === opt.modeId;
            const showPrice =
              vehicle === opt.id && localModeId === opt.modeId
                ? fee
                : opt.from;
            return (
              <li key={`${opt.id}-${opt.modeId ?? opt.label}`}>
                <button
                  type="button"
                  onClick={() => {
                    setVehicle(opt.id);
                    setLocalModeId(opt.modeId);
                  }}
                  className={`uber-press flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left ${
                    selected ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden">
                    <Image
                      src={opt.image}
                      alt=""
                      fill
                      className="object-contain object-center"
                      sizes="72px"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-black">
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
                  <span className="shrink-0 text-right text-[15px] font-bold text-black">
                    {formatMoney(showPrice, currency, countryCode)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Contact only if missing — otherwise tucked away */}
      {(needsContact || moreOpen) && (
        <div className="space-y-3 rounded-2xl bg-gray-50 p-3">
          {needsContact ? (
            <p className="text-xs font-semibold text-gray-600">
              Add your details to book
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <input
              className="ru-soft-field !bg-white text-sm"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="ru-soft-field !bg-white text-sm"
              placeholder={formatPhonePlaceholder(countryCode)}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              required
            />
          </div>
          {moreOpen ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-black">Passengers</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="uber-press flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold"
                    onClick={() => setPassengers((n) => Math.max(1, n - 1))}
                  >
                    −
                  </button>
                  <span className="w-4 text-center font-bold">{passengers}</span>
                  <button
                    type="button"
                    className="uber-press flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold"
                    onClick={() => setPassengers((n) => Math.min(6, n + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                className="ru-soft-field !bg-white text-sm"
                value={wearing}
                onChange={(e) => setWearing(e.target.value)}
                placeholder="What you're wearing (optional)"
                maxLength={120}
              />
              <PickupPhotoField file={pickupPhoto} onChange={setPickupPhoto} />
              <RiderPhotoField
                compact
                previewUrl={riderPhotoPreview}
                name={name}
                phone={phone}
                countryCode={countryCode}
                onChange={setRiderPhotoPreview}
              />
              <Link
                href="/delivery"
                className="block text-xs font-semibold text-gray-500 underline"
              >
                Moving goods? Switch to Delivery
              </Link>
            </>
          ) : null}
        </div>
      )}

      {!needsContact ? (
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="uber-press flex w-full items-center justify-center gap-1 py-1 text-sm font-semibold text-gray-600 hover:text-black"
        >
          {moreOpen ? "Less" : "More options"}
          <ChevronDown
            className={`h-4 w-4 transition ${moreOpen ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}

      <CheckoutBlock
        compact
        fee={fee}
        currency={currency}
        vehicle={vehicle}
        ready={ready}
        serviceType="ride"
        isNightRide={isNight}
        baseFee={baseFee}
        nightSurchargeAmount={nightExtra}
        buttonLabel={`Choose ${selectedLabel}`}
        description={`Village Ride · ${selectedLabel}${isNight ? " · Night" : ""}`}
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
              ...(guestPhoto ? { rider_photo_data_url: guestPhoto } : {}),
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
