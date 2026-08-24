"use client";

import { useEffect, useState, useTransition } from "react";
import { createCashJob } from "@/lib/actions";
import { bookingWhatsAppHref } from "@/lib/brand";
import { getGuestProfile, setGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { localInputToIso } from "@/components/uber/schedule-when";

type Pin = { lat: number; lng: number };

/**
 * Crash-proof Trip / Reserve form for older Android WebViews (Hisense).
 * No PayPal SDK, no Mapbox search widget, no next/image.
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

  function bookCash() {
    setMsg(null);
    if (!ready || !pickupPin || !dropoffPin) {
      setMsg("Fill name, phone, pickup and drop-off. Tap the map to set pins.");
      return;
    }
    start(async () => {
      try {
        setGuestProfile({
          name: name.trim(),
          phone: phone.trim(),
          country_code: countryCode,
        });
        const job = await createCashJob({
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
          dispatcher_notes: null,
          details: {
            seats: 1,
            route_name: `${pickup.trim()} → ${dropoff.trim()}`,
            direction: "to_village",
          },
          fee_amount: country.pricing?.ride?.base ?? 15,
        });
        window.location.assign(`/trip/${job.reference_code}`);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Could not book. Use WhatsApp.");
      }
    });
  }

  const wa = bookingWhatsAppHref({
    service_type: "ride",
    pickup_landmark: pickup || "—",
    dropoff_landmark: dropoff || "—",
    customer_name: name || "—",
    customer_phone: phone || "—",
    detailsLine: whenLater ? "Reserve" : "Trip now",
    paymentLabel: "Cash",
    estimateZar: country.pricing?.ride?.base ?? 15,
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

      {msg ? (
        <p className="rounded-xl bg-[#fdecea] px-3 py-2 text-[13px] text-[#b01000]">
          {msg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={bookCash}
        className="uber-press w-full rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
      >
        {pending ? "Finding driver…" : "Request Trip · Cash"}
      </button>
      <a
        href={wa}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-[15px] font-semibold text-white"
      >
        Or book on WhatsApp
      </a>
    </div>
  );
}
