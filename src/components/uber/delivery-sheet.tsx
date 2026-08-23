"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckoutBlock } from "@/components/uber/checkout-block";
import { BookingWhereTo } from "@/components/uber/booking-where-to";
import { SaveLocationPrompt } from "@/components/location/save-location-prompt";
import {
  LandmarkHelperText,
  type Loc,
} from "@/components/uber/landmark-field";
import {
  ScheduleWhen,
  defaultLaterLocal,
  localInputToIso,
  type WhenMode,
} from "@/components/uber/schedule-when";
import {
  SenderTypeField,
  senderTypeLabel,
  type SenderType,
} from "@/components/uber/sender-type-field";
import { quoteFareAction } from "@/lib/actions";
import { locsFromSearchParams } from "@/lib/booking-query";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import type { VehicleType, WeightCategory } from "@/lib/types";
import { WEIGHT_CATEGORIES } from "@/lib/pricing";
import { suggestVehicle } from "@/lib/vehicles";
import { WeightCategoryField } from "@/components/uber/weight-category-field";
import { FareBreakdownCard } from "@/components/uber/fare-breakdown-card";

export function DeliverySheet({
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
  const [senderType, setSenderType] = useState<SenderType>("individual");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [weight, setWeight] = useState<WeightCategory>("medium");
  const [notes, setNotes] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("bakkie");
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [fee, setFee] = useState(country.pricing.delivery.base);
  const [baseFee, setBaseFee] = useState(country.pricing.delivery.base);
  const [distanceFare, setDistanceFare] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [bookingFee, setBookingFee] = useState(5);
  const [villagePass, setVillagePass] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [nightExtra, setNightExtra] = useState(0);
  const [currency, setCurrency] = useState(country.currency);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteReady, setQuoteReady] = useState(false);

  const atIso = useMemo(
    () =>
      whenMode === "later" ? localInputToIso(scheduledLocal) : null,
    [whenMode, scheduledLocal],
  );

  useEffect(() => {
    const guest = getGuestProfile();
    if (guest?.name) setSenderName(guest.name);
    if (guest?.phone) setSenderPhone(guest.phone);
  }, []);

  useEffect(() => {
    setVehicle(
      suggestVehicle({ service_type: "delivery", weight_category: weight }),
    );
  }, [weight]);

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
          service_type: "delivery",
          country_code: countryCode,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          at: atIso,
          customer_phone: senderPhone || getGuestProfile()?.phone || null,
          weight_category: weight,
        });
        if (!cancelled) {
          setQuoteError(null);
          setQuoteReady(fare.quote_ready);
          if (!fare.quote_ready) return;
          setBaseFee(fare.base_fee_amount);
          setDistanceFare(fare.distance_fare);
          setDistanceKm(fare.distance_km);
          setBookingFee(fare.platform_commission || fare.booking_fee);
          setVillagePass(fare.village_pass);
          setNightExtra(fare.night_surcharge_amount);
          setIsNight(fare.is_night_ride);
          setFee(fare.fee_amount);
          setCurrency(fare.currency);
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
  }, [vehicle, weight, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, atIso, countryCode, senderPhone]);

  const itemLabel =
    WEIGHT_CATEGORIES.find((o) => o.id === weight)?.label ?? "Goods";

  const ready =
    Boolean(senderName.trim()) &&
    Boolean(senderPhone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    pickup.lat != null &&
    pickup.lng != null &&
    dropoff.lat != null &&
    dropoff.lng != null &&
    quoteReady &&
    !quoteError &&
    (whenMode === "now" || Boolean(atIso));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">
          Village Delivery
        </h1>
        <p className="text-sm text-slate-600">
          Town &amp; village — store-to-home, person-to-person, town-to-town.
          Fridges, furniture, building materials.
        </p>
      </div>

      <ScheduleWhen
        mode={whenMode}
        onModeChange={setWhenMode}
        scheduledLocal={scheduledLocal}
        onScheduledLocalChange={setScheduledLocal}
        nowLabel="Deliver Now"
      />

      <BookingWhereTo
        pickup={pickup}
        dropoff={dropoff}
        onPickup={setPickup}
        onDropoff={setDropoff}
        pickupPlaceholder="e.g., Farm gate next to the blue water tank"
        dropoffPlaceholder="e.g., Blue house after the church"
      />
      {pickup.landmark.trim() ? (
        <SaveLocationPrompt
          label={pickup.landmark}
          lat={pickup.lat}
          lng={pickup.lng}
        />
      ) : null}

      <SenderTypeField value={senderType} onChange={setSenderType} />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#000000]">
          Sender name
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#000000]">
          Sender phone
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            placeholder={formatPhonePlaceholder(countryCode)}
            inputMode="tel"
          />
        </label>
      </div>

      {dropoff.landmark.trim() ? (
        <SaveLocationPrompt
          label={dropoff.landmark}
          lat={dropoff.lat}
          lng={dropoff.lng}
        />
      ) : null}
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

      <WeightCategoryField
        value={weight}
        onChange={setWeight}
        serviceLabel="delivery"
      />

      <label className="block text-sm font-semibold text-[#000000]">
        Special notes
        <textarea
          rows={2}
          className="ru-soft-field mt-1.5 text-sm"
          placeholder="e.g., 2nd floor, fragile"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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

      {quoteError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {quoteError}
        </p>
      ) : null}

      <CheckoutBlock
        fee={fee}
        currency={currency}
        vehicle={vehicle}
        ready={ready}
        serviceType="delivery"
        isNightRide={isNight}
        baseFee={baseFee}
        nightSurchargeAmount={nightExtra}
        buttonLabel="Request Delivery"
        description={`Village Delivery · ${itemLabel}${isNight ? " · Night" : ""}`}
        draft={() => ({
          service_type: "delivery",
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
              `Sender type: ${senderTypeLabel(senderType)}`,
              `Weight: ${weight}`,
              isNight && "Night Ride (Premium) — after-hours safety surcharge",
              recipientName.trim() && `Recipient: ${recipientName.trim()}`,
              recipientPhone.trim() && `Recipient phone: ${recipientPhone.trim()}`,
              notes.trim(),
            ]
              .filter(Boolean)
              .join(" · ") || null,
          details: {
            item_description: itemLabel,
            weight_category: weight,
            size:
              weight === "light"
                ? "small"
                : weight === "medium"
                  ? "medium"
                  : weight === "heavy"
                    ? "large"
                    : "xl",
            needs_helpers: weight === "heavy" || weight === "extra_heavy",
            sender_type: senderType,
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
