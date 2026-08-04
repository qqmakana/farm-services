"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import type { CourierWeight, VehicleType } from "@/lib/types";
import { suggestVehicle } from "@/lib/vehicles";
import { FareBreakdownCard } from "@/components/uber/fare-breakdown-card";

const WEIGHT_OPTIONS = [
  {
    id: "under_5" as const,
    label: "Under 5 kg",
    hint: "Keys, documents, small gifts",
    size: "small" as const,
  },
  {
    id: "5_10" as const,
    label: "5–10 kg",
    hint: "Clothes bag, shoes, books",
    size: "small" as const,
  },
  {
    id: "10_20" as const,
    label: "10–20 kg",
    hint: "Small box / appliance (max ~20 kg)",
    size: "medium" as const,
  },
] as const;

function weightLabel(id: CourierWeight) {
  return WEIGHT_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function CourierSheet({
  onPinChange,
  mapTapPin = null,
  mapTapToken = 0,
}: {
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
  mapTapPin?: { lat: number; lng: number } | null;
  mapTapToken?: number;
}) {
  const { countryCode, country } = useCountry();
  const searchParams = useSearchParams();
  const initial = locsFromSearchParams(searchParams);
  const [pickup, setPickup] = useState<Loc>(initial.pickup);
  const [dropoff, setDropoff] = useState<Loc>(initial.dropoff);
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [weight, setWeight] = useState<CourierWeight>("under_5");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
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

  const weightOpt = WEIGHT_OPTIONS.find((o) => o.id === weight)!;
  const size = weightOpt.size;

  const atIso = useMemo(
    () => (whenMode === "later" ? localInputToIso(scheduledLocal) : null),
    [whenMode, scheduledLocal],
  );

  useEffect(() => {
    setVehicle(
      suggestVehicle({ service_type: "courier", delivery_size: size }),
    );
  }, [size]);

  useEffect(() => {
    onPinChange?.(
      pickup.lat != null && pickup.lng != null
        ? { lat: pickup.lat, lng: pickup.lng }
        : null,
    );
  }, [pickup.lat, pickup.lng, onPinChange]);

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
          service_type: "courier",
          country_code: countryCode,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          at: atIso,
          customer_phone: senderPhone || getGuestProfile()?.phone || null,
        });
        if (!cancelled) {
          // Unified courier pricing (same band as ride) — trust server quote
          setBaseFee(fare.base_fee_amount);
          setDistanceFare(fare.distance_fare);
          setDistanceKm(fare.distance_km);
          setBookingFee(fare.booking_fee);
          setVillagePass(fare.village_pass);
          setNightExtra(fare.night_surcharge_amount);
          setIsNight(fare.is_night_ride);
          setFee(fare.fee_amount);
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
    senderPhone,
  ]);

  const ready =
    Boolean(senderName.trim()) &&
    Boolean(senderPhone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    Boolean(itemDescription.trim()) &&
    (whenMode === "now" || Boolean(atIso));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Courier</h1>
        <p className="text-sm text-slate-600">
          Person-to-person courier across villages, towns &amp; cities — keys,
          gifts, documents, Marketplace items. Max ~20 kg, packaged &amp;
          sealed. No hazardous or perishable food.
        </p>
      </div>

      <ScheduleWhen
        mode={whenMode}
        onModeChange={setWhenMode}
        scheduledLocal={scheduledLocal}
        onScheduledLocalChange={setScheduledLocal}
        nowLabel="Send Now"
      />

      <GpsButton
        onPin={(coords) => setPickup((p) => ({ ...p, ...coords }))}
      />

      <LandmarkField
        label="Pickup location (address or landmark)"
        placeholder="e.g., Shoprite Mthatha, 12 Main Rd, or taxi rank"
        loc={pickup}
        onChange={setPickup}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#000000]">
          Your name
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#000000]">
          Your phone
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            placeholder={formatPhonePlaceholder(countryCode)}
            inputMode="tel"
          />
        </label>
      </div>

      <LandmarkField
        label="Dropoff location (address or landmark)"
        placeholder="e.g., 45 Commissioner St — or Qunu Clinic, school gate"
        loc={dropoff}
        onChange={setDropoff}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#000000]">
          Recipient name
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="block text-sm font-semibold text-[#000000]">
          Recipient phone
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="Optional"
          />
        </label>
      </div>
      <LandmarkHelperText />

      <label className="block text-sm font-semibold text-[#000000]">
        Item description
        <input
          className="ru-soft-field mt-1.5 text-sm"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder='e.g., "Clothes in a bag", "Small sealed box"'
        />
      </label>

      <label className="block text-sm font-semibold text-[#000000]">
        Item weight
        <select
          className="ru-soft-field mt-1.5 text-sm"
          value={weight}
          onChange={(e) => setWeight(e.target.value as CourierWeight)}
        >
          {WEIGHT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} — {o.hint}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-semibold text-[#000000]">
        Special instructions
        <textarea
          rows={2}
          className="ru-soft-field mt-1.5 text-sm"
          placeholder='e.g., "Call recipient when arriving"'
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
        />
      </label>

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
        serviceType="courier"
        isNightRide={isNight}
        baseFee={baseFee}
        nightSurchargeAmount={nightExtra}
        buttonLabel="Request Courier"
        description={`Courier · ${itemDescription.trim() || "Package"} · ${weightLabel(weight)}${isNight ? " · Night" : ""}`}
        draft={() => ({
          service_type: "courier",
          required_vehicle: vehicle,
          customer_name: senderName.trim(),
          customer_phone: senderPhone.trim(),
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          pickup_landmark: pickup.landmark.trim(),
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          dropoff_landmark: dropoff.landmark.trim(),
          scheduled_for: atIso,
          country_code: countryCode,
          dispatcher_notes:
            [
              isNight && "Night Ride (Premium) — after-hours safety surcharge",
              recipientName.trim() && `Recipient: ${recipientName.trim()}`,
              recipientPhone.trim() &&
                `Recipient phone: ${recipientPhone.trim()}`,
              specialInstructions.trim(),
            ]
              .filter(Boolean)
              .join(" · ") || null,
          details: {
            item_description: itemDescription.trim(),
            item_weight: weight,
            size,
            needs_helpers: false,
            recipient_name: recipientName.trim() || undefined,
            recipient_phone: recipientPhone.trim() || undefined,
            special_instructions: specialInstructions.trim() || undefined,
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
