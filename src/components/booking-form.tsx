"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PayPalCheckout } from "@/components/paypal-checkout";
import {
  capturePayPalAndCreateJob,
  createLocalPaidJob,
  createPayPalOrderAction,
  quoteFareAction,
} from "@/lib/actions";
import type { ServiceType, VehicleType } from "@/lib/types";
import {
  defaultFeeForVehicle,
  suggestVehicle,
  VEHICLE_BLURBS,
  VEHICLE_LABELS,
} from "@/lib/vehicles";

type Loc = {
  lat: number | null;
  lng: number | null;
  landmark: string;
};

const emptyLoc = (): Loc => ({ lat: null, lng: null, landmark: "" });

export function BookingForm({
  initialService = "ride",
  lockService = false,
}: {
  initialService?: ServiceType;
  lockService?: boolean;
}) {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<ServiceType>(initialService);
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fee, setFee] = useState("50");
  const [scheduledFor, setScheduledFor] = useState("");
  const [pickup, setPickup] = useState<Loc>(emptyLoc());
  const [dropoff, setDropoff] = useState<Loc>(emptyLoc());
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [seats, setSeats] = useState("1");
  const [routeName, setRouteName] = useState("Village → Town");
  const [direction, setDirection] = useState<"to_town" | "to_village">(
    "to_town",
  );

  const [itemDescription, setItemDescription] = useState("");
  const [size, setSize] = useState<"small" | "medium" | "large" | "xl">(
    "medium",
  );
  const [needsHelpers, setNeedsHelpers] = useState(false);

  const [farmItems, setFarmItems] = useState("Eggs x2, Chicken x1");
  const [farmNotes, setFarmNotes] = useState("");

  useEffect(() => {
    const next = suggestVehicle({
      service_type: serviceType,
      delivery_size: size,
    });
    setVehicle(next);
  }, [serviceType, size]);

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
        });
        if (!cancelled) setFee(String(fare.fee_amount));
      } catch {
        /* keep last fee */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicle, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  const vehicleOptions: VehicleType[] =
    serviceType === "ride" ? ["sedan"] : ["bakkie", "truck"];

  const formReady =
    Boolean(customerName.trim()) &&
    Boolean(customerPhone.trim()) &&
    Boolean(pickup.landmark.trim()) &&
    Boolean(dropoff.landmark.trim()) &&
    (serviceType !== "delivery" || Boolean(itemDescription.trim()));

  function captureGps(which: "pickup" | "dropoff") {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("GPS not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        if (which === "pickup") setPickup((p) => ({ ...p, ...next }));
        else setDropoff((p) => ({ ...p, ...next }));
      },
      () => setGpsError("Could not read GPS. Allow location or type landmarks."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function buildDetails() {
    if (serviceType === "ride") {
      return {
        seats: Number(seats) || 1,
        route_name: routeName,
        direction,
      };
    }
    if (serviceType === "delivery") {
      return {
        item_description: itemDescription || "Bulky item",
        size,
        needs_helpers: needsHelpers,
      };
    }
    const items = farmItems
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const match = part.match(/^(.+?)\s*[x×]\s*(\d+)$/i);
        if (match) {
          return { name: match[1].trim(), qty: Number(match[2]), price: 0 };
        }
        return { name: part, qty: 1, price: 0 };
      });
    return { items, notes: farmNotes || undefined };
  }

  function buildDraft() {
    return {
      service_type: serviceType,
      required_vehicle: vehicle,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      pickup_landmark: pickup.landmark.trim(),
      dropoff_lat: dropoff.lat,
      dropoff_lng: dropoff.lng,
      dropoff_landmark: dropoff.landmark.trim(),
      scheduled_for: scheduledFor
        ? new Date(scheduledFor).toISOString()
        : null,
      details: buildDetails(),
      fee_amount: Number(fee) || 0,
    };
  }

  return (
    <div className="space-y-6">
      {!lockService && (
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900">
          What do you need?
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["ride", "Ride (people)"],
              ["delivery", "Send goods"],
              ["farm", "Farm Connect"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setServiceType(value)}
              className={`rounded-lg border px-3 py-3 text-left text-sm ${
                serviceType === value
                  ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      )}
      {lockService && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {serviceType === "farm" &&
            "Farm Connect — order from a farm. Pickup = farm gate. Bakkie delivery."}
          {serviceType === "ride" &&
            "Ride — people only. Car will be matched."}
          {serviceType === "delivery" &&
            "Goods delivery — bakkie or truck."}
        </p>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900">
          Choose vehicle
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {vehicleOptions.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setVehicle(v);
              }}
              className={`rounded-lg border px-3 py-3 text-left ${
                vehicle === v
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="block text-sm font-semibold">
                {VEHICLE_LABELS[v]}
              </span>
              <span
                className={`mt-1 block text-xs ${
                  vehicle === v ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {VEHICLE_BLURBS[v]}
              </span>
              <span className="mt-2 block text-sm font-medium">
                from R{defaultFeeForVehicle(v)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Your name</span>
          <input
            required
            className="ru-input mt-1"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Phone</span>
          <input
            required
            className="ru-input mt-1"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="060 502 9496"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LocationFields
          title="Pickup"
          loc={pickup}
          onChange={setPickup}
          onGps={() => captureGps("pickup")}
        />
        <LocationFields
          title="Dropoff"
          loc={dropoff}
          onChange={setDropoff}
          onGps={() => captureGps("dropoff")}
        />
      </div>

      {gpsError && <p className="text-sm text-amber-800">{gpsError}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-800">When (optional)</span>
          <input
            type="datetime-local"
            className="ru-input mt-1"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Fare (R) — set by server</span>
          <input
            type="number"
            readOnly
            className="ru-input mt-1 bg-slate-50"
            value={fee}
          />
          <span className="mt-1 block text-xs text-slate-500">
            Calculated from vehicle + distance. PayPal charges this amount.
          </span>
        </label>
      </div>

      {serviceType === "ride" && (
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium">Seats</span>
            <input
              type="number"
              min="1"
              className="ru-input mt-1"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Route</span>
            <input
              className="ru-input mt-1"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Direction</span>
            <select
              className="ru-input mt-1"
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as "to_town" | "to_village")
              }
            >
              <option value="to_town">To town</option>
              <option value="to_village">To village</option>
            </select>
          </label>
        </div>
      )}

      {serviceType === "delivery" && (
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">What are we moving?</span>
            <input
              required
              className="ru-input mt-1"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Fridge, TV, couch, wardrobe…"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Size</span>
            <select
              className="ru-input mt-1"
              value={size}
              onChange={(e) =>
                setSize(e.target.value as "small" | "medium" | "large" | "xl")
              }
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xl">XL</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={needsHelpers}
              onChange={(e) => setNeedsHelpers(e.target.checked)}
            />
            Needs loading helpers
          </label>
        </div>
      )}

      {serviceType === "farm" && (
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm">
            <span className="font-medium">Items</span>
            <input
              className="ru-input mt-1"
              value={farmItems}
              onChange={(e) => setFarmItems(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Notes</span>
            <input
              className="ru-input mt-1"
              value={farmNotes}
              onChange={(e) => setFarmNotes(e.target.value)}
            />
          </label>
        </div>
      )}

      {formError && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {formError}
        </p>
      )}

      <PayPalCheckout
        amount={Number(fee) || 0}
        description={`${VEHICLE_LABELS[vehicle]} · Village Ride`}
        disabled={!formReady}
        onCreateOrder={async () => {
          setFormError(null);
          if (!formReady) throw new Error("Complete the form first.");
          const { orderId } = await createPayPalOrderAction({
            vehicle,
            pickup_lat: pickup.lat,
            pickup_lng: pickup.lng,
            dropoff_lat: dropoff.lat,
            dropoff_lng: dropoff.lng,
            description: `Village Ride ${serviceType} · ${VEHICLE_LABELS[vehicle]}`,
          });
          return orderId;
        }}
        onApprove={async (orderId) => {
          setFormError(null);
          try {
            const job = await capturePayPalAndCreateJob(orderId, buildDraft());
            router.push(`/trip/${job.reference_code}`);
            router.refresh();
          } catch (err) {
            setFormError(
              err instanceof Error ? err.message : "Payment failed",
            );
            throw err;
          }
        }}
        onLocalPay={async () => {
          setFormError(null);
          if (!formReady) throw new Error("Complete the form first.");
          const job = await createLocalPaidJob(buildDraft());
          router.push(`/trip/${job.reference_code}`);
          router.refresh();
        }}
      />
    </div>
  );
}

function LocationFields({
  title,
  loc,
  onChange,
  onGps,
}: {
  title: string;
  loc: Loc;
  onChange: (loc: Loc) => void;
  onGps: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onGps}
          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-200"
        >
          Use GPS pin
        </button>
      </div>
      <label className="mt-3 block text-sm">
        <span className="font-medium text-slate-800">
          Landmark <span className="text-rose-600">*</span>
        </span>
        <textarea
          required
          rows={2}
          className="ru-input mt-1"
          placeholder="e.g. White house opposite clinic, green gate"
          value={loc.landmark}
          onChange={(e) => onChange({ ...loc, landmark: e.target.value })}
        />
      </label>
      <p className="mt-2 text-xs text-slate-500">
        {loc.lat != null && loc.lng != null
          ? `Pin: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
          : "No GPS pin yet — landmark alone is OK."}
      </p>
    </div>
  );
}
