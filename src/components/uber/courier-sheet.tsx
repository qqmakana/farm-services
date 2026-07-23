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
import { useCountry } from "@/components/country/country-provider";
import type { CourierWeight, VehicleType } from "@/lib/types";
import { suggestVehicle } from "@/lib/vehicles";

const WEIGHT_OPTIONS = [
  {
    id: "under_5" as const,
    label: "Under 5 kg",
    hint: "Keys, documents, small gifts",
    from: 30,
    size: "small" as const,
  },
  {
    id: "5_10" as const,
    label: "5–10 kg",
    hint: "Clothes bag, shoes, books",
    from: 50,
    size: "small" as const,
  },
  {
    id: "10_20" as const,
    label: "10–20 kg",
    hint: "Small box / appliance (max ~20 kg)",
    from: 80,
    size: "medium" as const,
  },
] as const;

function weightLabel(id: CourierWeight) {
  return WEIGHT_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function CourierSheet({
  onPinChange,
}: {
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
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
  const [fee, setFee] = useState(country.pricing.delivery.base);
  const [baseFee, setBaseFee] = useState(country.pricing.delivery.base);
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
        });
        if (!cancelled) {
          const floor = weightOpt.from;
          const base = Math.max(fare.base_fee_amount, floor);
          const surcharge = fare.is_night_ride
            ? Math.round((base * fare.night_surcharge_pct) / 100)
            : 0;
          setBaseFee(base);
          setNightExtra(surcharge);
          setIsNight(fare.is_night_ride);
          setFee(base + surcharge);
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
    weight,
    weightOpt.from,
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    atIso,
    countryCode,
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
        <h1 className="text-xl font-bold text-[#1A4D3A]">Send a package</h1>
        <p className="text-sm text-slate-600">
          Person-to-person courier between villages — keys, gifts, documents,
          Marketplace items. Max ~20 kg, packaged &amp; sealed. No hazardous or
          perishable food.
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
        label="Pickup location"
        placeholder="e.g., Shoprite Mthatha, home gate, taxi rank"
        loc={pickup}
        onChange={setPickup}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Your name
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Your phone
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
          />
        </label>
      </div>

      <LandmarkField
        label="Dropoff location"
        placeholder="e.g., Qunu Clinic, recipient home, school"
        loc={dropoff}
        onChange={setDropoff}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Recipient name
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Recipient phone
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="Optional"
          />
        </label>
      </div>
      <LandmarkHelperText />

      <label className="block text-sm font-semibold text-[#1A4D3A]">
        Item description
        <input
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder='e.g., "Clothes in a bag", "Small sealed box"'
        />
      </label>

      <label className="block text-sm font-semibold text-[#1A4D3A]">
        Item weight
        <select
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          value={weight}
          onChange={(e) => setWeight(e.target.value as CourierWeight)}
        >
          {WEIGHT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} — from R{o.from} ({o.hint})
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-semibold text-[#1A4D3A]">
        Special instructions
        <textarea
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          placeholder='e.g., "Call recipient when arriving"'
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
        />
      </label>

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
