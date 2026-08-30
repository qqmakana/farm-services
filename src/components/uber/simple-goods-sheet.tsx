"use client";

import { useEffect, useState, useTransition } from "react";
import {
  PaymentSelector,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-selector";
import { useCountry } from "@/components/country/country-provider";
import { SafeCardPay } from "@/components/uber/safe-card-pay";
import {
  capturePayPalAndCreateJob,
  createCashJob,
  createLocalPaidJob,
  createPayPalOrderAction,
} from "@/lib/actions";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { getGuestProfile, setGuestProfile } from "@/lib/guest-profile";
import {
  WEIGHT_CATEGORIES,
  vehicleForWeight,
  type WeightCategory,
} from "@/lib/pricing";
import { getCapturedReferrer } from "@/lib/rider-referral";
import { stashPaypalApproveUrl, stashPaypalBooking } from "@/lib/paypal-draft";
import { SERVICE_COPY } from "@/lib/service-guide";
import { ListedShopCrossSell } from "@/components/uber/listed-shop-cross-sell";
import type { CourierPackageType, JobDetails, NewJobInput, ServiceType } from "@/lib/types";
import { suggestVehicle, VEHICLE_LABELS } from "@/lib/vehicles";

type Pin = { lat: number; lng: number };
type GoodsService = "delivery" | "courier" | "farm";
type Draft = Omit<NewJobInput, "payment">;

const FARM_TYPES = [
  "Produce to market (vegetables, fruit, maize)",
  "Livestock (goats, chickens, cattle)",
  "Equipment (tractor, plow, tools)",
  "Supplies (feed, fertilizer, seed)",
] as const;

/**
 * Delivery / Courier / Farm form for older Android WebViews.
 * Card (PayPal) loads only after Card is selected. No Mapbox search widget.
 */
export function SimpleGoodsSheet({
  service,
  onPinChange,
  onDropoffPinChange,
  mapTapPin = null,
  mapTapToken = 0,
}: {
  service: GoodsService;
  onPinChange?: (pin: Pin | null) => void;
  onDropoffPinChange?: (pin: Pin | null) => void;
  mapTapPin?: Pin | null;
  mapTapToken?: number;
}) {
  const { country, countryCode } = useCountry();
  const center = country.mapCenter;
  const [shopMode, setShopMode] = useState(false);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [item, setItem] = useState("");
  const [shopName, setShopName] = useState("");
  const [list, setList] = useState("");
  const [weight, setWeight] = useState<WeightCategory>(
    service === "delivery" ? "medium" : "light",
  );
  const [insured, setInsured] = useState(false);
  const [pkg, setPkg] = useState<CourierPackageType>("documents");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [express, setExpress] = useState(false);
  const [farmType, setFarmType] = useState<string>(FARM_TYPES[0]);
  const [pickupPin, setPickupPin] = useState<Pin | null>(center);
  const [dropoffPin, setDropoffPin] = useState<Pin | null>(null);
  const [nextPinIsDropoff, setNextPinIsDropoff] = useState(false);
  const [payMethod, setPayMethod] = useState<CheckoutPaymentChoice>("cash");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("kind") === "shop") setShopMode(true);
      const to = q.get("to");
      if (to) setDropoff(to);
      const toLat = Number(q.get("toLat"));
      const toLng = Number(q.get("toLng"));
      if (Number.isFinite(toLat) && Number.isFinite(toLng)) {
        setDropoffPin({ lat: toLat, lng: toLng });
      }
    } catch {
      /* ignore */
    }
    const guest = getGuestProfile();
    if (guest?.name) setName(guest.name);
    if (guest?.phone) setPhone(guest.phone);
  }, []);

  useEffect(() => {
    if (!mapTapPin || !mapTapToken) return;
    if (nextPinIsDropoff || (pickupPin && !dropoffPin)) {
      setDropoffPin(mapTapPin);
      setDropoff((d) => d.trim() || "Dropped pin");
      setNextPinIsDropoff(false);
    } else {
      setPickupPin(mapTapPin);
      setPickup((p) => p.trim() || "Current location");
    }
  }, [mapTapPin, mapTapToken]);

  useEffect(() => {
    onPinChange?.(pickupPin);
  }, [pickupPin, onPinChange]);

  useEffect(() => {
    onDropoffPinChange?.(dropoffPin);
  }, [dropoffPin, onDropoffPinChange]);

  const copy =
    service === "delivery" && shopMode
      ? SERVICE_COPY.shopAndDeliver
      : SERVICE_COPY[service];
  const heading =
    service === "delivery" && shopMode ? "I know the shop" : copy.title;

  const vehicle =
    service === "courier"
      ? "sedan"
      : service === "farm"
        ? vehicleForWeight(weight)
        : suggestVehicle({
            service_type: "delivery",
            weight_category: weight,
          });

  const estimate =
    service === "courier"
      ? country.pricing?.ride?.base ?? 15
      : service === "farm"
        ? country.pricing?.farm?.base ?? 25
        : country.pricing?.delivery?.base ?? 20;

  const extraOk =
    service === "courier"
      ? Boolean(recipientPhone.trim())
      : service === "farm"
        ? Boolean(farmType)
        : shopMode
          ? Boolean(list.trim()) && Boolean(shopName.trim() || pickup.trim())
          : Boolean(item.trim());

  const ready =
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(pickup.trim()) &&
    Boolean(dropoff.trim()) &&
    pickupPin != null &&
    dropoffPin != null &&
    extraOk;

  function details(): JobDetails {
    if (service === "courier") {
      return {
        item_description: item.trim() || (pkg === "documents" ? "Documents" : "Small package"),
        item_weight: "under_5",
        size: "small",
        needs_helpers: false,
        recipient_phone: recipientPhone.trim(),
        package_type: pkg,
        is_express: express,
        curb_to_curb: true,
      };
    }
    if (service === "farm") {
      return {
        items: [{ name: farmType, qty: 1, price: 0 }],
        notes: item.trim() || undefined,
        weight_category: weight,
        produce_type: farmType,
        loading_assistance: true,
      };
    }
    return {
      item_description: shopMode
        ? list.trim().slice(0, 80) || item.trim() || "Shopping list"
        : item.trim(),
      weight_category: weight,
      needs_helpers: weight === "heavy" || weight === "extra_heavy",
      photo_proof_requested: true,
      insurance: insured,
      ...(shopMode
        ? {
            shop_mode: "shop_and_deliver" as const,
            shop_name: shopName.trim(),
            shopping_list: list.trim(),
          }
        : {}),
    };
  }

  function buildDraft(): Draft {
    if (!pickupPin || !dropoffPin) {
      throw new Error("Tap the map to set pickup and drop-off pins.");
    }
    const notes = [
      service === "courier" && express && "Express courier",
      service === "delivery" && insured && "Goods insurance",
      service === "farm" && farmType,
    ]
      .filter(Boolean)
      .join(" · ");
    const ref = getCapturedReferrer();
    const tag = ref ? `Rider referral: ${ref}` : "";
    const dispatcher = [notes, tag].filter(Boolean).join(" · ") || null;
    return {
      service_type: service as ServiceType,
      required_vehicle: vehicle,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      pickup_lat: pickupPin.lat,
      pickup_lng: pickupPin.lng,
      pickup_landmark:
        shopMode && shopName.trim()
          ? `Shop: ${shopName.trim()} · ${pickup.trim()}`
          : pickup.trim(),
      dropoff_lat: dropoffPin.lat,
      dropoff_lng: dropoffPin.lng,
      dropoff_landmark: dropoff.trim(),
      country_code: countryCode,
      dispatcher_notes: dispatcher,
      details: details(),
      fee_amount: estimate,
    };
  }

  function saveGuest() {
    setGuestProfile({
      name: name.trim(),
      phone: phone.trim(),
      country_code: countryCode,
    });
  }

  function bookCash() {
    setMsg(null);
    if (!ready) {
      setMsg("Fill the form and tap the map for pickup and drop-off pins.");
      return;
    }
    start(async () => {
      try {
        saveGuest();
        const job = await createCashJob(buildDraft());
        window.location.assign(`/trip/${job.reference_code}`);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Could not book. Try again.");
      }
    });
  }

  return (
    <div className="space-y-3 text-black">
      <h1 className="text-center text-[22px] font-bold">{heading}</h1>
      <p className="text-center text-[13px] text-[#6B6B6B]">{copy.blurb}</p>
      {service === "delivery" ? (
        <ListedShopCrossSell
          queries={[shopName, pickup, list, item]}
        />
      ) : null}
      {service === "delivery" ? (
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Fetch type"
        >
          <button
            type="button"
            aria-pressed={shopMode}
            onClick={() => setShopMode(true)}
            className={`uber-press min-h-11 rounded-full text-[13px] font-bold ${
              shopMode ? "bg-black text-white" : "bg-[#F3F3F3] text-black"
            }`}
          >
            Shop list
          </button>
          <a
            href="/farm"
            className="uber-press flex min-h-11 items-center justify-center rounded-full bg-[#F3F3F3] text-[13px] font-bold text-black"
          >
            Farm
          </a>
          <button
            type="button"
            onClick={() => {
              setShopMode(true);
              setItem((v) => v.trim() || "Clinic meds — pay at the till");
              setPickup((v) => v.trim() || "Clinic / pharmacy");
            }}
            className="uber-press min-h-11 rounded-full bg-[#F3F3F3] text-[13px] font-bold text-black"
          >
            Clinic
          </button>
        </div>
      ) : null}
      <p className="text-center text-[13px] text-[#6B6B6B]">
        Type landmarks, then tap the map for pickup and drop-off pins.
      </p>

      <input
        className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
        placeholder={
          shopMode ? "Shop / pickup — e.g. Shoprite" : "Pickup landmark"
        }
        value={pickup}
        onChange={(e) => setPickup(e.target.value)}
      />
      <input
        className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
        placeholder="Drop-off landmark"
        value={dropoff}
        onChange={(e) => setDropoff(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setNextPinIsDropoff(false)}
          className="min-h-12 flex-1 rounded-full bg-[#F3F3F3] text-[14px] font-semibold"
        >
          Next map tap = pickup
        </button>
        <button
          type="button"
          onClick={() => setNextPinIsDropoff(true)}
          className="min-h-12 flex-1 rounded-full bg-[#F3F3F3] text-[14px] font-semibold"
        >
          Next map tap = drop-off
        </button>
      </div>

      {shopMode ? (
        <>
          <input
            className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
            placeholder="Shop name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <textarea
            className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
            rows={3}
            placeholder="Shopping list — milk, bread, maize…"
            value={list}
            onChange={(e) => setList(e.target.value)}
          />
        </>
      ) : service === "courier" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPkg("documents")}
              className={`min-h-12 rounded-full text-[14px] font-semibold ${
                pkg === "documents" ? "bg-black text-white" : "bg-[#F3F3F3]"
              }`}
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => setPkg("small_package")}
              className={`min-h-12 rounded-full text-[14px] font-semibold ${
                pkg === "small_package" ? "bg-black text-white" : "bg-[#F3F3F3]"
              }`}
            >
              Small package
            </button>
          </div>
          <input
            className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
            placeholder="What are you sending (optional)"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
          <input
            className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
            placeholder="Recipient phone"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            inputMode="tel"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExpress(false)}
              className={`min-h-12 rounded-full text-[14px] font-semibold ${
                !express ? "bg-black text-white" : "bg-[#F3F3F3]"
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setExpress(true)}
              className={`min-h-12 rounded-full text-[14px] font-semibold ${
                express ? "bg-black text-white" : "bg-[#F3F3F3]"
              }`}
            >
              Express (1.5×)
            </button>
          </div>
        </>
      ) : (
        <>
          {service === "farm" ? (
            <select
              className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
              value={farmType}
              onChange={(e) => setFarmType(e.target.value)}
            >
              {FARM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
              placeholder="What are you sending"
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          )}
          <p className="text-[13px] font-semibold">Weight</p>
          <div className="grid grid-cols-2 gap-2">
            {WEIGHT_CATEGORIES.map((w) => (
              <button
                key={w.id}
                type="button"
                data-testid={`weight-${w.id}`}
                onClick={() => setWeight(w.id)}
                className={`min-h-12 rounded-full px-2 text-[13px] font-semibold ${
                  weight === w.id ? "bg-black text-white" : "bg-[#F3F3F3]"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </>
      )}

      {service === "delivery" && !shopMode ? (
        <div>
          <p className="text-[13px] font-semibold">Goods insurance</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="delivery-insurance-off"
              onClick={() => setInsured(false)}
              className={`min-h-12 rounded-full text-[14px] font-semibold ${
                !insured ? "bg-black text-white" : "bg-[#F3F3F3]"
              }`}
            >
              No cover
            </button>
            <button
              type="button"
              data-testid="delivery-insurance-on"
              onClick={() => setInsured(true)}
              className={`min-h-12 rounded-full text-[14px] font-semibold ${
                insured ? "bg-black text-white" : "bg-[#F3F3F3]"
              }`}
            >
              Add cover
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <input
          className="rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
          placeholder={formatPhonePlaceholder(countryCode)}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
        />
      </div>

      <PaymentSelector
        value={payMethod}
        onChange={setPayMethod}
        currencyLabel={country.currencySymbol}
      />

      {msg ? (
        <p className="rounded-xl bg-[#fdecea] px-3 py-2 text-[13px] text-[#b01000]">
          {msg}
        </p>
      ) : null}

      {payMethod === "cash" ? (
        <button
          type="button"
          disabled={pending}
          onClick={bookCash}
          className="uber-press w-full rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
        >
          {pending ? "Finding driver…" : `Request ${heading} · Cash`}
        </button>
      ) : (
        <SafeCardPay
          amount={estimate}
          description={`Village Ride · ${heading}`}
          disabled={!ready}
          submitLabel={`Request ${heading} · Card`}
          onCreateOrder={async () => {
            setMsg(null);
            if (!ready) throw new Error("Complete the form first.");
            saveGuest();
            const d = buildDraft();
            stashPaypalBooking(d);
            const { orderId, approveUrl } = await createPayPalOrderAction({
              vehicle,
              service_type: service,
              country_code: d.country_code || countryCode,
              customer_phone: d.customer_phone,
              pickup_lat: d.pickup_lat,
              pickup_lng: d.pickup_lng,
              dropoff_lat: d.dropoff_lat,
              dropoff_lng: d.dropoff_lng,
              description: `Village Ride ${service} · ${VEHICLE_LABELS[vehicle]}`,
              at: d.scheduled_for ?? null,
              details: d.details,
              is_express: service === "courier" ? express : undefined,
            });
            stashPaypalApproveUrl(approveUrl);
            return { orderId, approveUrl };
          }}
          onApprove={async (orderId) => {
            setMsg(null);
            try {
              saveGuest();
              const job = await capturePayPalAndCreateJob(orderId, buildDraft());
              window.location.assign(`/trip/${job.reference_code}`);
            } catch (err) {
              setMsg(err instanceof Error ? err.message : "Payment failed");
              throw err;
            }
          }}
          onLocalPay={async () => {
            setMsg(null);
            if (!ready) throw new Error("Complete the form first.");
            saveGuest();
            const job = await createLocalPaidJob(buildDraft());
            window.location.assign(`/trip/${job.reference_code}`);
          }}
        />
      )}
    </div>
  );
}
