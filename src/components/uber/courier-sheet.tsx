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
import { quoteFareAction } from "@/lib/actions";
import { locsFromSearchParams } from "@/lib/booking-query";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import type {
  CourierPackageType,
  CourierWeight,
  VehicleType,
} from "@/lib/types";
import { SIZE_VEHICLE, suggestVehicle, VEHICLE_EMOJI } from "@/lib/vehicles";
import { SERVICE_COPY } from "@/lib/service-guide";
import { FareBreakdownCard } from "@/components/uber/fare-breakdown-card";

const PACKAGE_OPTIONS = [
  {
    id: "documents" as const,
    label: "Documents",
    hint: "Letters, IDs, contracts",
    weight: "under_5" as CourierWeight,
    size: "small" as const,
  },
  {
    id: "small_package" as const,
    label: "Small package",
    hint: "Sealed bag or box",
    weight: "under_5" as CourierWeight,
    size: "small" as const,
  },
  {
    id: "medium_package" as const,
    label: "Medium package",
    hint: "Groceries-size bag",
    weight: "5_10" as CourierWeight,
    size: "medium" as const,
  },
  {
    id: "furniture" as const,
    label: "Furniture / farm goods",
    hint: "Needs a bakkie",
    weight: "10_20" as CourierWeight,
    size: "medium" as const,
  },
] as const;

export function CourierSheet({
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
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [packageType, setPackageType] =
    useState<CourierPackageType>("documents");
  const [isExpress, setIsExpress] = useState(false);
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
  const [expressExtra, setExpressExtra] = useState(0);
  const [currency, setCurrency] = useState(country.currency);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteReady, setQuoteReady] = useState(false);

  const pack = PACKAGE_OPTIONS.find((o) => o.id === packageType) ?? PACKAGE_OPTIONS[0];
  const itemDescription = pack.label;

  useEffect(() => {
    const size =
      packageType === "furniture"
        ? "large"
        : packageType === "medium_package"
          ? "medium"
          : "small";
    setVehicle(
      suggestVehicle({ service_type: "courier", delivery_size: size }),
    );
  }, [packageType]);

  const atIso = useMemo(
    () => (whenMode === "later" ? localInputToIso(scheduledLocal) : null),
    [whenMode, scheduledLocal],
  );

  useEffect(() => {
    const guest = getGuestProfile();
    if (guest?.name) setSenderName((n) => n || guest.name);
    if (guest?.phone) setSenderPhone((p) => p || guest.phone);
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
          vehicle,
          service_type: "courier",
          country_code: countryCode,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          at: atIso,
          customer_phone: senderPhone || getGuestProfile()?.phone || null,
          is_express: isExpress,
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
          setExpressExtra(fare.express_extra);
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
    vehicle,
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    atIso,
    countryCode,
    senderPhone,
    isExpress,
  ]);

  const ready =
    Boolean(senderName.trim()) &&
    Boolean(senderPhone.trim()) &&
    Boolean(recipientPhone.trim()) &&
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
          {SERVICE_COPY.courier.title}
        </h1>
        <p className="text-sm text-slate-600">{SERVICE_COPY.courier.blurb}</p>
      </div>

      <ScheduleWhen
        mode={whenMode}
        onModeChange={setWhenMode}
        scheduledLocal={scheduledLocal}
        onScheduledLocalChange={setScheduledLocal}
        nowLabel="Send Now"
      />

      <BookingWhereTo
        pickup={pickup}
        dropoff={dropoff}
        onPickup={setPickup}
        onDropoff={setDropoff}
        pickupPlaceholder="Meet at the curb — e.g. Shoprite entrance"
        dropoffPlaceholder="Recipient curb — e.g. office gate, house"
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
            placeholder={formatPhonePlaceholder(countryCode)}
            inputMode="tel"
            required
          />
        </label>
      </div>
      <p className="text-xs text-gray-500">
        After booking, share the trip link from Activity so they can track
        without the app.
      </p>
      <LandmarkHelperText />

      <div role="group" aria-label="Package type">
        <p className="text-sm font-semibold text-black">What are you sending?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PACKAGE_OPTIONS.map((o) => {
            const selected = packageType === o.id;
            const size =
              o.id === "furniture"
                ? "large"
                : o.id === "medium_package"
                  ? "medium"
                  : "small";
            const v = SIZE_VEHICLE[size];
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setPackageType(o.id)}
                className={`uber-press rounded-2xl border px-3 py-3 text-left ${
                  selected
                    ? "border-2 border-black bg-white"
                    : "border border-transparent bg-gray-50"
                }`}
              >
                <span className="block text-lg leading-none">
                  {VEHICLE_EMOJI[v]}
                </span>
                <span className="mt-1 block text-sm font-semibold text-black">
                  {o.label}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {o.hint}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Curb-to-curb. Max 15 kg. No alcohol, medication, or dangerous goods.
          Packages: agree a PIN with the recipient.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-black">Speed</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsExpress(false)}
            className={`uber-press min-h-12 rounded-full px-3 text-sm font-bold ${
              !isExpress
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setIsExpress(true)}
            className={`uber-press min-h-12 rounded-full px-3 text-sm font-bold ${
              isExpress
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Express (1.5×)
          </button>
        </div>
        {isExpress ? (
          <p className="mt-1 text-xs text-gray-500">
            Priority dispatch — aim for under 30 minutes when a driver is
            nearby.
          </p>
        ) : null}
      </div>

      <label className="block text-sm font-semibold text-[#000000]">
        Special instructions
        <textarea
          rows={2}
          className="ru-soft-field mt-1.5 text-sm"
          placeholder='e.g., "Meet at the gate, call when arriving"'
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
        expressExtra={expressExtra}
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
        serviceType="courier"
        isNightRide={isNight}
        baseFee={baseFee}
        nightSurchargeAmount={nightExtra}
        buttonLabel="Request Courier"
        description={`Courier · ${itemDescription}${isExpress ? " · Express" : ""}${isNight ? " · Night" : ""}`}
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
              "Curb-to-curb courier",
              isExpress && "Express — aim under 30 min",
              isNight && "Night Ride (Premium) — after-hours safety surcharge",
              recipientName.trim() && `Recipient: ${recipientName.trim()}`,
              `Recipient phone: ${recipientPhone.trim()}`,
              "Share trip link from Activity — do not send SMS from the app",
              specialInstructions.trim(),
            ]
              .filter(Boolean)
              .join(" · ") || null,
          details: {
            item_description: itemDescription,
            item_weight: pack.weight,
            size: pack.size,
            needs_helpers: false,
            package_type: packageType,
            is_express: isExpress,
            curb_to_curb: true,
            recipient_name: recipientName.trim() || undefined,
            recipient_phone: recipientPhone.trim(),
            special_instructions: specialInstructions.trim() || undefined,
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
