"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckoutBlock } from "@/components/uber/checkout-block";
import { BookingWhereTo } from "@/components/uber/booking-where-to";
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
import { PhoneDigitHint } from "@/components/ui/phone-digit-hint";
import type { VehicleType, WeightCategory } from "@/lib/types";
import { SERVICE_COPY } from "@/lib/service-guide";
import { vehicleForWeight } from "@/lib/pricing";
import { WeightCategoryField } from "@/components/uber/weight-category-field";
import { FareBreakdownCard } from "@/components/uber/fare-breakdown-card";

const TRANSPORT_TYPES = [
  "Produce to market (vegetables, fruit, maize)",
  "Livestock (goats, chickens, cattle)",
  "Equipment (tractor, plow, tools)",
  "Supplies (feed, fertilizer, seed)",
] as const;

export function FarmSheet({
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
  const [farmName, setFarmName] = useState("");
  const [senderType, setSenderType] = useState<SenderType>("individual");
  const [pickup, setPickup] = useState<Loc>(initial.pickup);
  const [dropoff, setDropoff] = useState<Loc>(initial.dropoff);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [transport, setTransport] =
    useState<(typeof TRANSPORT_TYPES)[number]>(TRANSPORT_TYPES[0]);
  const [weight, setWeight] = useState<WeightCategory>("medium");
  const [livestockTruck, setLivestockTruck] = useState(false);
  const [loadingHelp, setLoadingHelp] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [fee, setFee] = useState(country.pricing.farm.base);
  const [baseFee, setBaseFee] = useState(country.pricing.farm.base);
  const [distanceFare, setDistanceFare] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [bookingFee, setBookingFee] = useState(5);
  const [villagePass, setVillagePass] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [nightExtra, setNightExtra] = useState(0);
  const [currency, setCurrency] = useState(country.currency);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteReady, setQuoteReady] = useState(false);

  const requiredVehicle: VehicleType = livestockTruck
    ? "truck"
    : vehicleForWeight(weight);

  const atIso = useMemo(
    () =>
      whenMode === "later" ? localInputToIso(scheduledLocal) : null,
    [whenMode, scheduledLocal],
  );

  useEffect(() => {
    const guest = getGuestProfile();
    if (guest?.name) setName((n) => n || guest.name);
    if (guest?.phone) setPhone((p) => p || guest.phone);
  }, []);

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
          vehicle: requiredVehicle,
          service_type: "farm",
          country_code: countryCode,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          at: atIso,
          customer_phone: phone || getGuestProfile()?.phone || null,
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
  }, [
    requiredVehicle,
    weight,
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    atIso,
    countryCode,
    phone,
  ]);

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">
          {SERVICE_COPY.farm.title}
        </h1>
        <p className="text-sm text-slate-600">{SERVICE_COPY.farm.blurb}</p>
      </div>

      <ScheduleWhen
        mode={whenMode}
        onModeChange={setWhenMode}
        scheduledLocal={scheduledLocal}
        onScheduledLocalChange={setScheduledLocal}
        nowLabel="Transport Now"
        laterHint="Book for later today or the next day. Bakkie and truck drivers only."
      />

      <SenderTypeField
        value={senderType}
        onChange={setSenderType}
        label="Sender type"
      />

      <label className="block text-sm font-semibold text-[#000000]">
        Farm / business / place name
        <input
          className="ru-soft-field mt-1.5 text-sm"
          placeholder="e.g., Magwaza farm, Nkomazi co-op, town supplier"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
        />
      </label>

      <BookingWhereTo
        pickup={pickup}
        dropoff={dropoff}
        onPickup={setPickup}
        onDropoff={setDropoff}
        pickupPlaceholder="Farm gate — landmark the driver can find"
        dropoffPlaceholder="Market, processor, depot, or co-op"
      />
      <LandmarkHelperText />

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#000000]">
          Your name
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#000000]">
          Phone
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={formatPhonePlaceholder(countryCode)}
            inputMode="tel"
          />
          <PhoneDigitHint phone={phone} countryCode={countryCode} />
        </label>
      </div>

      <label className="block text-sm font-semibold text-[#000000]">
        Transport type
        <select
          className="ru-soft-field mt-1.5 text-sm"
          value={transport}
          onChange={(e) =>
            setTransport(e.target.value as (typeof TRANSPORT_TYPES)[number])
          }
        >
          {TRANSPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <WeightCategoryField
        value={weight}
        onChange={setWeight}
        serviceLabel="farm load"
      />

      <label className="flex items-center gap-2 text-sm font-semibold text-[#000000]">
        <input
          type="checkbox"
          checked={loadingHelp}
          onChange={(e) => setLoadingHelp(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Driver helps load and unload
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-[#000000]">
        <input
          type="checkbox"
          checked={livestockTruck}
          onChange={(e) => setLivestockTruck(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Needs livestock truck
      </label>

      <label className="block text-sm font-semibold text-[#000000]">
        Quantity notes (optional)
        <input
          className="ru-soft-field mt-1.5 text-sm"
          placeholder="e.g., 10 bags maize, 5 goats"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
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
        vehicle={requiredVehicle}
        ready={ready}
        serviceType="farm"
        isNightRide={isNight}
        baseFee={baseFee}
        nightSurchargeAmount={nightExtra}
        buttonLabel="Request Farm Transport"
        description={`Farm Connect · ${transport}${isNight ? " · Night" : ""}`}
        draft={() => ({
          service_type: "farm",
          required_vehicle: requiredVehicle,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          pickup_landmark: [
            farmName.trim() && `Farm: ${farmName.trim()}`,
            pickup.landmark.trim(),
          ]
            .filter(Boolean)
            .join(" · "),
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          dropoff_landmark: dropoff.landmark.trim(),
          scheduled_for: atIso,
          country_code: countryCode,
          dispatcher_notes:
            [
              `Sender type: ${senderTypeLabel(senderType)}`,
              `Weight: ${weight}`,
              loadingHelp && "Loading assistance included",
              livestockTruck && "Needs livestock truck",
              "Photo of load condition at pickup and drop-off",
              isNight &&
                "Night Ride (Premium) — after-hours safety surcharge applied",
            ]
              .filter(Boolean)
              .join(" · ") || null,
          details: {
            items: [
              {
                name: transport,
                qty: 1,
                price: 0,
              },
              ...(quantity.trim()
                ? [{ name: quantity.trim(), qty: 1, price: 0 }]
                : []),
            ],
            weight_category: weight,
            notes: [
              livestockTruck ? "Needs livestock truck" : "",
              loadingHelp ? "Driver helps load/unload" : "",
            ]
              .filter(Boolean)
              .join(" · ") || undefined,
            sender_type: senderType,
            produce_type: transport,
            loading_assistance: loadingHelp,
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
