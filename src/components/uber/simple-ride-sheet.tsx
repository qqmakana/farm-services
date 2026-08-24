"use client";

import { useEffect, useState, useTransition } from "react";
import {
  PaymentSelector,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-selector";
import { useCountry } from "@/components/country/country-provider";
import { SafeCardPay } from "@/components/uber/safe-card-pay";
import { localInputToIso } from "@/components/uber/schedule-when";
import {
  capturePayPalAndCreateJob,
  createCashJob,
  createLocalPaidJob,
  createPayPalOrderAction,
} from "@/lib/actions";
import { bookingWhatsAppHref } from "@/lib/brand";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { getGuestProfile, setGuestProfile } from "@/lib/guest-profile";
import { getCapturedReferrer } from "@/lib/rider-referral";
import type { NewJobInput } from "@/lib/types";

type Pin = { lat: number; lng: number };
type Draft = Omit<NewJobInput, "payment">;

/**
 * Trip / Reserve form for older Android WebViews (Hisense).
 * Card (PayPal) loads only after Card is selected. No Mapbox search widget.
 */
export function SimpleRideSheet({
  onPinChange,
  onDropoffPinChange,
  mapTapPin = null,
  mapTapToken = 0,
}: {
  onPinChange?: (pin: Pin | null) => void;
  onDropoffPinChange?: (pin: Pin | null) => void;
  mapTapPin?: Pin | null;
  mapTapToken?: number;
}) {
  const { country, countryCode } = useCountry();
  const center = country.mapCenter;
  const [whenLater, setWhenLater] = useState(false);
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupPin, setPickupPin] = useState<Pin | null>(center);
  const [dropoffPin, setDropoffPin] = useState<Pin | null>(null);
  const [nextPinIsDropoff, setNextPinIsDropoff] = useState(false);
  const [payMethod, setPayMethod] = useState<CheckoutPaymentChoice>("cash");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("when") === "later") setWhenLater(true);
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

  const ready =
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(pickup.trim()) &&
    Boolean(dropoff.trim()) &&
    pickupPin != null &&
    dropoffPin != null;

  function buildDraft(): Draft {
    if (!pickupPin || !dropoffPin) {
      throw new Error("Tap the map to set pickup and drop-off pins.");
    }
    const ref = getCapturedReferrer();
    const tag = ref ? `Rider referral: ${ref}` : null;
    return {
      service_type: "ride",
      required_vehicle: "sedan",
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      pickup_lat: pickupPin.lat,
      pickup_lng: pickupPin.lng,
      pickup_landmark: pickup.trim(),
      dropoff_lat: dropoffPin.lat,
      dropoff_lng: dropoffPin.lng,
      dropoff_landmark: dropoff.trim(),
      scheduled_for: whenLater ? localInputToIso(scheduledLocal) : null,
      country_code: countryCode,
      dispatcher_notes: tag,
      details: {
        seats: 1,
        route_name: `${pickup.trim()} → ${dropoff.trim()}`,
        direction: "to_village",
      },
      fee_amount: country.pricing?.ride?.base ?? 15,
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
      setMsg("Fill name, phone, pickup and drop-off. Tap the map to set pins.");
      return;
    }
    start(async () => {
      try {
        saveGuest();
        const job = await createCashJob(buildDraft());
        window.location.assign(`/trip/${job.reference_code}`);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Could not book. Use WhatsApp.");
      }
    });
  }

  const estimate = country.pricing?.ride?.base ?? 15;
  const wa = bookingWhatsAppHref({
    service_type: "ride",
    pickup_landmark: pickup || "—",
    dropoff_landmark: dropoff || "—",
    customer_name: name || "—",
    customer_phone: phone || "—",
    detailsLine: whenLater ? "Reserve" : "Trip now",
    paymentLabel: payMethod === "card" ? "Card (PayPal)" : "Cash",
    estimateZar: estimate,
    currencySymbol: country.currencySymbol,
  });

  return (
    <div className="space-y-3 text-black">
      <h1 className="text-center text-[22px] font-bold">
        {whenLater ? "Reserve a trip" : "Plan your ride"}
      </h1>
      <p className="text-center text-[13px] text-[#6B6B6B]">
        Type landmarks, then tap the map for pickup and drop-off pins.
      </p>

      <input
        className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
        placeholder="Pickup — e.g. Engen, taxi rank"
        value={pickup}
        onChange={(e) => setPickup(e.target.value)}
      />
      <input
        className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
        placeholder="Where to?"
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

      {whenLater ? (
        <>
          <input
            type="datetime-local"
            className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
            value={scheduledLocal}
            onChange={(e) => setScheduledLocal(e.target.value)}
          />
          <p data-testid="reservation-fee-line" className="text-[13px] text-[#6B6B6B]">
            Includes R10 reservation fee. Cancel free until 1 hour before.
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setWhenLater(true)}
          className="min-h-12 w-full rounded-full bg-[#F3F3F3] text-[15px] font-semibold"
        >
          Schedule for later (Reserve)
        </button>
      )}

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
          {pending ? "Finding driver…" : "Request Trip · Cash"}
        </button>
      ) : (
        <SafeCardPay
          amount={estimate}
          description="Village Ride · Trip"
          disabled={!ready}
          submitLabel="Request Trip · Card"
          onCreateOrder={async () => {
            setMsg(null);
            if (!ready) throw new Error("Complete the form first.");
            saveGuest();
            const d = buildDraft();
            const { orderId } = await createPayPalOrderAction({
              vehicle: "sedan",
              service_type: "ride",
              country_code: d.country_code || countryCode,
              customer_phone: d.customer_phone,
              pickup_lat: d.pickup_lat,
              pickup_lng: d.pickup_lng,
              dropoff_lat: d.dropoff_lat,
              dropoff_lng: d.dropoff_lng,
              description: "Village Ride trip · Go (car)",
              at: d.scheduled_for ?? null,
              details: d.details,
            });
            return orderId;
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
      <a
        href={wa}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-[15px] font-semibold text-white"
      >
        Or book on WhatsApp
      </a>
    </div>
  );
}
