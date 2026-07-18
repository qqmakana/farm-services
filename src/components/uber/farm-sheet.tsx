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

const TRANSPORT_TYPES = [
  "Produce (vegetables, fruits, maize)",
  "Livestock (goats, chickens, cattle)",
  "Equipment (tractor, plow, tools)",
  "Supplies (feed, fertilizer, seed)",
] as const;

const VEHICLES = [
  { id: "bakkie" as const, label: "Bakkie (small load)", from: 180 },
  { id: "truck" as const, label: "Truck with sides (medium)", from: 350 },
  {
    id: "livestock" as const,
    label: "Livestock truck",
    from: 400,
    mapsTo: "truck" as VehicleType,
  },
] as const;

export function FarmSheet({
  onPinChange,
}: {
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
}) {
  const searchParams = useSearchParams();
  const [farmName, setFarmName] = useState("");
  const [senderType, setSenderType] = useState<SenderType>("individual");
  const [pickup, setPickup] = useState<Loc>(() => ({
    ...emptyLoc(),
    landmark: searchParams.get("to") ?? "",
  }));
  const [dropoff, setDropoff] = useState<Loc>(emptyLoc());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [transport, setTransport] =
    useState<(typeof TRANSPORT_TYPES)[number]>(TRANSPORT_TYPES[0]);
  const [vehicleChoice, setVehicleChoice] =
    useState<(typeof VEHICLES)[number]["id"]>("bakkie");
  const [quantity, setQuantity] = useState("");
  const [whenMode, setWhenMode] = useState<WhenMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultLaterLocal);
  const [fee, setFee] = useState(180);
  const [baseFee, setBaseFee] = useState(180);
  const [isNight, setIsNight] = useState(false);
  const [nightExtra, setNightExtra] = useState(0);

  const requiredVehicle: VehicleType =
    vehicleChoice === "bakkie" ? "bakkie" : "truck";
  const fromPrice =
    VEHICLES.find((v) => v.id === vehicleChoice)?.from ?? 180;

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
          vehicle: requiredVehicle,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          at: atIso,
        });
        if (!cancelled) {
          const base = Math.max(fare.base_fee_amount, fromPrice);
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
  }, [
    requiredVehicle,
    fromPrice,
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    atIso,
  ]);

  const ready =
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    (whenMode === "now" || Boolean(atIso));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1A4D3A]">Farm Connect</h1>
        <p className="text-sm text-slate-600">
          Farm &amp; regional logistics anywhere — produce, livestock, equipment.
        </p>
      </div>

      <ScheduleWhen
        mode={whenMode}
        onModeChange={setWhenMode}
        scheduledLocal={scheduledLocal}
        onScheduledLocalChange={setScheduledLocal}
        nowLabel="Transport Now"
      />

      <SenderTypeField
        value={senderType}
        onChange={setSenderType}
        label="Sender type"
      />

      <label className="block text-sm font-semibold text-[#1A4D3A]">
        Farm / business / place name
        <input
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          placeholder="e.g., Magwaza farm, Nkomazi co-op, town supplier"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
        />
      </label>

      <GpsButton
        onPin={(coords) => setPickup((p) => ({ ...p, ...coords }))}
      />

      <LandmarkField
        label="Pickup landmark"
        placeholder="e.g., Town hardware store, Village main road, or Farm gate"
        loc={pickup}
        onChange={setPickup}
      />
      <LandmarkField
        label="Dropoff landmark"
        placeholder="e.g., Home address, Village landmark, or Town market"
        loc={dropoff}
        onChange={setDropoff}
      />
      <LandmarkHelperText />

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Your name
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[#1A4D3A]">
          Phone
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-[#1A4D3A]">
        Transport type
        <select
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
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

      <div>
        <p className="text-sm font-semibold text-[#1A4D3A]">Vehicle needed</p>
        <div className="mt-2 space-y-2">
          {VEHICLES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVehicleChoice(opt.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                vehicleChoice === opt.id
                  ? "border-[#1A4D3A] bg-[#FFF3E0]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-semibold text-[#1A4D3A]">
                {opt.label}
              </span>
              <span className="text-sm text-slate-600">from R{opt.from}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm font-semibold text-[#1A4D3A]">
        Weight / quantity estimate
        <input
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm"
          placeholder="e.g., 10 bags maize, 5 goats"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>

      <CheckoutBlock
        fee={fee}
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
          dispatcher_notes:
            [
              `Sender type: ${senderTypeLabel(senderType)}`,
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
            notes:
              vehicleChoice === "livestock"
                ? "Needs livestock truck"
                : undefined,
            sender_type: senderType,
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
