"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckoutBlock } from "@/components/uber/checkout-block";
import {
  GpsButton,
  LandmarkField,
  LandmarkHelperText,
  emptyLoc,
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
import type { VehicleType } from "@/lib/types";
import { suggestVehicle } from "@/lib/vehicles";

const ITEM_OPTIONS = [
  {
    id: "small" as const,
    label: "Small item (TV, microwave, boxes)",
    from: 80,
  },
  {
    id: "medium" as const,
    label: "Medium item (Fridge, washing machine)",
    from: 150,
  },
  {
    id: "large" as const,
    label: "Large item (Couch, bed, stove)",
    from: 250,
  },
  {
    id: "xl" as const,
    label: "Building materials (cement, roof sheets)",
    from: 200,
  },
] as const;

export function DeliverySheet({
  onPinChange,
}: {
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
}) {
  const searchParams = useSearchParams();
  const [pickup, setPickup] = useState<Loc>(emptyLoc());
  const [dropoff, setDropoff] = useState<Loc>(() => ({
    ...emptyLoc(),
    landmark: searchParams.get("to") ?? "",
  }));
  const [senderType, setSenderType] = useState<SenderType>("individual");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [size, setSize] =
    useState<(typeof ITEM_OPTIONS)[number]["id"]>("medium");
  const [notes, setNotes] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("bakkie");
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [fee, setFee] = useState(150);
  const [baseFee, setBaseFee] = useState(150);
  const [isNight, setIsNight] = useState(false);
  const [nightExtra, setNightExtra] = useState(0);

  const atIso = useMemo(
    () =>
      whenMode === "later" ? localInputToIso(scheduledLocal) : null,
    [whenMode, scheduledLocal],
  );

  useEffect(() => {
    setVehicle(suggestVehicle({ service_type: "delivery", delivery_size: size }));
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
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          at: atIso,
        });
        if (!cancelled) {
          const floor = ITEM_OPTIONS.find((o) => o.id === size)?.from ?? 80;
          const base = Math.max(fare.base_fee_amount, floor);
          const surcharge = fare.is_night_ride
            ? Math.round((base * fare.night_surcharge_pct) / 100)
            : 0;
          setBaseFee(base);
          setNightExtra(surcharge);
          setIsNight(fare.is_night_ride);
          setFee(base + surcharge);
        }
      } catch {
        /* keep */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicle, size, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, atIso]);

  const itemLabel =
    ITEM_OPTIONS.find((o) => o.id === size)?.label ?? "Goods";

  const ready =
    Boolean(senderName.trim()) &&
    Boolean(senderPhone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    (whenMode === "now" || Boolean(atIso));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1A4D3A]">Village Delivery</h1>
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

      <SenderTypeField value={senderType} onChange={setSenderType} />

      <GpsButton
        onPin={(coords) => setPickup((p) => ({ ...p, ...coords }))}
      />

      <LandmarkField
        label="Pickup landmark"
        placeholder="e.g., Town hardware store, Village main road, or Farm gate"
        loc={pickup}
        onChange={setPickup}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Sender name
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Sender phone
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
          />
        </label>
      </div>

      <LandmarkField
        label="Dropoff landmark"
        placeholder="e.g., Home address, Village landmark, or Town market"
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
        What are you sending?
        <select
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          value={size}
          onChange={(e) =>
            setSize(e.target.value as (typeof ITEM_OPTIONS)[number]["id"])
          }
        >
          {ITEM_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} — from R{o.from}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-semibold text-[#1A4D3A]">
        Special notes
        <textarea
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          placeholder="e.g., 2nd floor, fragile"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <CheckoutBlock
        fee={fee}
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
          dispatcher_notes:
            [
              `Sender type: ${senderTypeLabel(senderType)}`,
              isNight && "Night Ride (Premium) — after-hours safety surcharge",
              recipientName.trim() && `Recipient: ${recipientName.trim()}`,
              recipientPhone.trim() && `Recipient phone: ${recipientPhone.trim()}`,
              notes.trim(),
            ]
              .filter(Boolean)
              .join(" · ") || null,
          details: {
            item_description: itemLabel,
            size,
            needs_helpers: size === "large" || size === "xl",
            sender_type: senderType,
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
