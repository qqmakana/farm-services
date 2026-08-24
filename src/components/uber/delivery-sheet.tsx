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
import { SERVICE_COPY } from "@/lib/service-guide";
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
  const shopMode = searchParams.get("kind") === "shop";
  const initial = locsFromSearchParams(searchParams);
  const [pickup, setPickup] = useState<Loc>(initial.pickup);
  const [dropoff, setDropoff] = useState<Loc>(initial.dropoff);
  const [senderType, setSenderType] = useState<SenderType>("individual");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [shopName, setShopName] = useState("");
  const [shoppingList, setShoppingList] = useState("");
  const [weight, setWeight] = useState<WeightCategory>(
    shopMode ? "light" : "medium",
  );
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
  const [insured, setInsured] = useState(false);
  const [insuranceFee, setInsuranceFee] = useState(0);

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
          details: { insurance: insured },
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
          setInsuranceFee(fare.insurance_fee);
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
  }, [vehicle, weight, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, atIso, countryCode, senderPhone, insured]);

  const itemLabel =
    shopMode && shoppingList.trim()
      ? shoppingList.trim().slice(0, 80)
      : itemDescription.trim() ||
        WEIGHT_CATEGORIES.find((o) => o.id === weight)?.label ||
        "Goods";

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
    (whenMode === "now" || Boolean(atIso)) &&
    (shopMode
      ? Boolean(shoppingList.trim()) && Boolean(shopName.trim() || pickup.landmark.trim())
      : Boolean(itemDescription.trim()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">
          {shopMode
            ? SERVICE_COPY.shopAndDeliver.title
            : SERVICE_COPY.delivery.title}
        </h1>
        <p className="text-sm text-slate-600">
          {shopMode
            ? SERVICE_COPY.shopAndDeliver.blurb
            : SERVICE_COPY.delivery.blurb}
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
        pickupPlaceholder={
          shopMode
            ? "Shop name or supermarket — e.g. Shoprite Mthatha"
            : "Pickup — sender meets driver"
        }
        dropoffPlaceholder={
          shopMode
            ? "Where to drop the shopping"
            : "Drop-off — recipient address"
        }
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

      {shopMode ? (
        <>
          <label className="block text-sm font-semibold text-[#000000]">
            Shop name
            <input
              className="ru-soft-field mt-1.5 text-sm"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder='e.g. "any supermarket near me" or Checkers Sandton'
            />
          </label>
          <label className="block text-sm font-semibold text-[#000000]">
            Shopping list
            <textarea
              rows={4}
              className="ru-soft-field mt-1.5 text-sm"
              value={shoppingList}
              onChange={(e) => setShoppingList(e.target.value)}
              placeholder="2L milk, bread, 2kg maize… Driver pays at the till — you settle goods with them. Village Ride charges delivery only."
            />
          </label>
        </>
      ) : (
        <label className="block text-sm font-semibold text-[#000000]">
          What are you sending
          <input
            className="ru-soft-field mt-1.5 text-sm"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="e.g. sealed box, microwave, building sand"
          />
        </label>
      )}

      <WeightCategoryField
        value={weight}
        onChange={setWeight}
        serviceLabel="delivery"
      />

      <div>
        <p className="text-sm font-semibold text-black">Goods insurance</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="delivery-insurance-off"
            onClick={() => setInsured(false)}
            className={`uber-press min-h-12 rounded-full px-3 text-sm font-bold ${
              !insured ? "bg-black text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            No cover
          </button>
          <button
            type="button"
            data-testid="delivery-insurance-on"
            onClick={() => setInsured(true)}
            className={`uber-press min-h-12 rounded-full px-3 text-sm font-bold ${
              insured ? "bg-black text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Add cover
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Optional cover for loss or damage in transit. Added to the delivery
          fee before the 90/10 split.
        </p>
      </div>

      <label className="block text-sm font-semibold text-[#000000]">
        Special notes
        <textarea
          rows={2}
          className="ru-soft-field mt-1.5 text-sm"
          placeholder={
            shopMode
              ? "Gate code, substitutions OK?"
              : "e.g. 2nd floor, fragile. Driver photos load at pickup and drop-off."
          }
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
        insuranceFee={insuranceFee}
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
        buttonLabel={shopMode ? "Request Shop & Deliver" : "Request Delivery"}
        description={`${shopMode ? "Shop & Deliver" : "Delivery"} · ${itemLabel}${isNight ? " · Night" : ""}`}
        draft={() => ({
          service_type: "delivery",
          required_vehicle: vehicle,
          customer_name: senderName.trim(),
          customer_phone: senderPhone.trim(),
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          pickup_landmark: [
            shopMode && shopName.trim() && `Shop: ${shopName.trim()}`,
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
              shopMode &&
                "Shop & Deliver — rider pays goods at till; Village Ride delivery fee only",
              "Photo proof at pickup and drop-off",
              insured && "Goods insurance included",
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
            recipient_name: recipientName.trim() || undefined,
            recipient_phone: recipientPhone.trim() || undefined,
            photo_proof_requested: true,
            insurance: insured,
            ...(shopMode
              ? {
                  shop_mode: "shop_and_deliver" as const,
                  shop_name: shopName.trim(),
                  shopping_list: shoppingList.trim(),
                }
              : {}),
          },
          fee_amount: fee,
        })}
      />
    </div>
  );
}
