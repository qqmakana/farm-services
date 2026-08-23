"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, User } from "lucide-react";
import { CheckoutBlock } from "@/components/uber/checkout-block";
import { BookingWhereTo } from "@/components/uber/booking-where-to";
import { type Loc } from "@/components/uber/landmark-field";
import { PickupPhotoField } from "@/components/location/pickup-photo-field";
import { RiderPhotoField } from "@/components/rider/rider-photo-field";
import { getGuestProfile } from "@/lib/guest-profile";
import { compressPickupPhotoDataUrl } from "@/lib/pickup-photo";
import {
  defaultLaterLocal,
  localInputToIso,
  maxReserveLocal,
  minReserveLocal,
  toLocalInputValue,
  type WhenMode,
} from "@/components/uber/schedule-when";
import { SERVICE_COPY } from "@/lib/service-guide";
import { quoteFareAction } from "@/lib/actions";
import { locsFromSearchParams } from "@/lib/booking-query";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { formatMoney } from "@/lib/format";
import type { VehicleType } from "@/lib/types";
import { reservationFeeAmount } from "@/lib/pricing";

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
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteReady, setQuoteReady] = useState(false);
  const [etaLabel, setEtaLabel] = useState("Few min");
  const [reservationFee, setReservationFee] = useState(0);

  useEffect(() => {
    const guest = getGuestProfile();
    if (guest?.photo_data_url) setRiderPhotoPreview(guest.photo_data_url);
    if (guest?.name) setName((n) => n || guest.name);
    if (guest?.phone) setPhone((p) => p || guest.phone);
  }, []);

  useEffect(() => {
    const at = searchParams.get("at");
    if (searchParams.get("when") === "later") {
      setWhenMode("later");
      if (at) {
        const d = new Date(at);
        if (!Number.isNaN(d.getTime())) {
          const min = new Date(Date.now() + 30 * 60 * 1000);
          const max = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const clamped = d < min ? min : d > max ? max : d;
          setScheduledLocal(toLocalInputValue(clamped));
        } else {
          setScheduledLocal(minReserveLocal());
        }
      } else {
        setScheduledLocal((cur) => {
          const d = new Date(cur);
          const min = new Date(Date.now() + 30 * 60 * 1000);
          return d < min ? minReserveLocal() : cur;
        });
      }
    }
  }, [searchParams]);

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
          setQuoteError(null);
          setQuoteReady(fare.quote_ready);
          if (fare.quote_ready) {
            setFee(fare.fee_amount);
            setBaseFee(fare.base_fee_amount);
            setIsNight(fare.is_night_ride);
            setNightExtra(fare.night_surcharge_amount);
            setReservationFee(fare.reservation_fee);
            setCurrency(fare.currency);
            const mins = Math.max(
              1,
              Math.round((fare.route_duration_seconds || 0) / 60),
            );
            setEtaLabel(mins <= 1 ? "1 min" : `${mins} min`);
          } else {
            setFee(country.pricing.ride.base);
            setEtaLabel("Few min");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setQuoteReady(false);
          setQuoteError(
            err instanceof Error ? err.message : "Could not calculate fare.",
          );
        }
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
    pickup.lat != null &&
    pickup.lng != null &&
    dropoff.lat != null &&
    dropoff.lng != null &&
    quoteReady &&
    !quoteError &&
    (whenMode === "now" || Boolean(atIso));

  const reserveAddOn =
    whenMode === "later"
      ? reservationFee > 0
        ? reservationFee
        : reservationFeeAmount(countryCode)
      : 0;

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
      eta: etaLabel,
    },
    {
      id: "bakkie" as VehicleType,
      label: "Bakkie",
      capacity: 6,
      from: country.pricing.delivery.base,
      modeId: null as string | null,
      image: "/home/sug-farm.jpg",
      eta: etaLabel,
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

  return (
    <div className="space-y-3 touch-manipulation">
      <BookingWhereTo
        pickup={pickup}
        dropoff={dropoff}
        onPickup={setPickup}
        onDropoff={setDropoff}
        whenMode={whenMode}
        whenLabel={
          whenMode === "later"
            ? new Date(scheduledLocal).toLocaleString("en-ZA", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : undefined
        }
        forMeLabel={name.trim() ? name.trim().split(" ")[0] : "For me"}
        onToggleWhen={() =>
          setWhenMode((m) => (m === "now" ? "later" : "now"))
        }
        onForMe={() => setMoreOpen(true)}
      />

      {quoteError ? (
        <p
          data-testid="quote-error"
          className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
        >
          {quoteError}
        </p>
      ) : null}

      {whenMode === "later" ? (
        <div className="space-y-2">
          <input
            type="datetime-local"
            className="ru-soft-field text-sm"
            value={scheduledLocal}
            min={minReserveLocal()}
            max={maxReserveLocal()}
            onChange={(e) => setScheduledLocal(e.target.value)}
          />
          <p className="text-xs text-gray-500">{SERVICE_COPY.reserve.blurb}</p>
          {reserveAddOn > 0 ? (
            <p className="text-xs font-medium text-gray-700">
              Includes {formatMoney(reserveAddOn, currency, countryCode)}{" "}
              reservation fee.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Choose a ride — Uber product list */}
      <div>
        <p className="mb-2 text-[22px] font-bold tracking-[-0.04em] text-[#0a0a0a]">
          Choose a ride
        </p>
        <ul>
          {vehicleOptions.map((opt) => {
            const selected =
              vehicle === opt.id && localModeId === opt.modeId;
            const showPrice =
              vehicle === opt.id && localModeId === opt.modeId && quoteReady
                ? fee
                : opt.from + reserveAddOn;
            const mins = Number.parseInt(String(opt.eta), 10);
            const arrival =
              Number.isFinite(mins) && mins > 0
                ? (() => {
                    const d = new Date();
                    d.setMinutes(d.getMinutes() + mins);
                    const time = d.toLocaleTimeString("en-ZA", {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    return `${time} · ${mins} min`;
                  })()
                : opt.eta;
            return (
              <li key={`${opt.id}-${opt.modeId ?? opt.label}`}>
                <button
                  type="button"
                  onClick={() => {
                    setVehicle(opt.id);
                    setLocalModeId(opt.modeId);
                  }}
                  className={`uber-press flex w-full items-center gap-3 rounded-[14px] px-2 py-3 text-left ${
                    selected
                      ? "ring-2 ring-[#0a0a0a] ring-inset"
                      : ""
                  }`}
                >
                  <span className="relative h-16 w-[4.75rem] shrink-0 overflow-hidden">
                    <Image
                      src={opt.image}
                      alt=""
                      fill
                      className="object-contain object-center"
                      sizes="76px"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[16px] font-bold tracking-[-0.02em] text-[#0a0a0a]">
                      {opt.label}
                      <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#6b6b6b]">
                        <User className="h-3.5 w-3.5" aria-hidden />
                        {opt.capacity}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium text-[#6b6b6b]">
                      {arrival}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[16px] font-bold tracking-[-0.02em] text-[#0a0a0a]">
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
              <label className="block text-sm font-semibold text-black">
                What are you wearing
                <input
                  className="ru-soft-field mt-1.5 !bg-white text-sm font-normal"
                  value={wearing}
                  onChange={(e) => setWearing(e.target.value)}
                  placeholder="e.g. red jacket, blue cap (optional)"
                  maxLength={120}
                />
              </label>
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
        reservationFee={reserveAddOn}
        buttonLabel={`Choose ${selectedLabel}`}
        onSchedule={() => setWhenMode("later")}
        description={`Village Ride · ${whenMode === "later" ? "Reserve · " : ""}${selectedLabel}${isNight ? " · Night" : ""}`}
        draft={async () => {
          // Only attach already-compressed JPEGs (~80–180KB). Raw camera
          // data URLs blow the Server Action body and fail in production.
          const guest = getGuestProfile();
          const guestPath = guest?.photo_url || null;
          const faceData =
            riderPhotoPreview &&
            riderPhotoPreview.startsWith("data:image/") &&
            riderPhotoPreview.length < 240_000
              ? riderPhotoPreview
              : null;
          const pickupDataUrl = pickupPhoto
            ? await compressPickupPhotoDataUrl(pickupPhoto)
            : null;
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
            dispatcher_notes: [
              isNight
                ? "Night Ride (Premium) — after-hours safety surcharge applied"
                : null,
              pickupDataUrl ? "Rider attached a pickup photo" : null,
            ]
              .filter(Boolean)
              .join(" · ") || null,
            details: {
              seats: passengers,
              route_name: `${pickup.landmark} → ${dropoff.landmark}`,
              direction: "to_village" as const,
              ...(localModeId ? { local_mode: localModeId } : {}),
              ...(wearing.trim() ? { wearing: wearing.trim() } : {}),
              ...(guestPath && !guestPath.startsWith("mock://")
                ? { rider_photo_url: guestPath }
                : {}),
              ...(faceData ? { rider_photo_data_url: faceData } : {}),
              ...(pickupDataUrl
                ? { pickup_photo_data_url: pickupDataUrl }
                : {}),
            },
            fee_amount: fee,
          };
        }}
      />
    </div>
  );
}
