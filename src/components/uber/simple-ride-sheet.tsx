"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, User } from "lucide-react";
import {
  PaymentSelector,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-selector";
import { useCountry } from "@/components/country/country-provider";
import { SafeCardPay } from "@/components/uber/safe-card-pay";
import { localInputToIso } from "@/components/uber/schedule-when";
import { WhereToBar } from "@/components/uber/where-to-bar";
import {
  capturePayPalAndCreateJob,
  createCashJobResult,
  createLocalPaidJob,
  createPayPalOrderAction,
  quoteFareAction,
} from "@/lib/actions";
import { searchAddressesAction } from "@/lib/actions-mapbox";
import { bookingWhatsAppHref } from "@/lib/brand";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { formatMoney } from "@/lib/format";
import { etaMinutes } from "@/lib/geo";
import { getGuestProfile, setGuestProfile } from "@/lib/guest-profile";
import type { AddressSuggestion } from "@/lib/mapbox-types";
import { getCapturedReferrer } from "@/lib/rider-referral";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import type { PlaceSuggestion } from "@/lib/suggestions";
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
  onMapLabelsChange,
  mapTapPin = null,
  mapTapToken = 0,
  searchNonce = 0,
  onSnap,
}: {
  onPinChange?: (pin: Pin | null) => void;
  onDropoffPinChange?: (pin: Pin | null) => void;
  onMapLabelsChange?: (next: {
    pickup: string;
    dropoff: string;
    etaMins: number;
  }) => void;
  mapTapPin?: Pin | null;
  mapTapToken?: number;
  /** Parent back from choose-ride → search. */
  searchNonce?: number;
  onSnap?: (snap: "peek" | "mid" | "full") => void;
}) {
  const { country, countryCode } = useCountry();
  const [whenLater, setWhenLater] = useState(false);
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupPin, setPickupPin] = useState<Pin | null>(null);
  const [dropoffPin, setDropoffPin] = useState<Pin | null>(null);
  const [nextPinIsDropoff, setNextPinIsDropoff] = useState(false);
  const [payMethod, setPayMethod] = useState<CheckoutPaymentChoice>("cash");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fee, setFee] = useState(country.pricing?.ride?.base ?? 15);
  const [etaMins, setEtaMins] = useState(7);
  const [quoteReady, setQuoteReady] = useState(false);
  const [dropHits, setDropHits] = useState<AddressSuggestion[]>([]);
  const [dropFocused, setDropFocused] = useState(false);
  const dropoffRef = useRef<HTMLInputElement>(null);

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
    // First token is auto-GPS — always pickup, never drop-off.
    if (mapTapToken === 1 && !nextPinIsDropoff) {
      setPickupPin(mapTapPin);
      setPickup((p) => p.trim() || "Current location");
      return;
    }
    if (nextPinIsDropoff) {
      setDropoffPin(mapTapPin);
      setDropoff((d) => d.trim() || "Dropped pin");
      setNextPinIsDropoff(false);
      return;
    }
    if (!pickupPin) {
      setPickupPin(mapTapPin);
      setPickup((p) => p.trim() || "Current location");
      return;
    }
    if (!dropoffPin) {
      setDropoffPin(mapTapPin);
      setDropoff((d) => d.trim() || "Dropped pin");
      return;
    }
    setPickupPin(mapTapPin);
    setPickup((p) => p.trim() || "Current location");
  }, [mapTapPin, mapTapToken]);

  useEffect(() => {
    onPinChange?.(pickupPin);
  }, [pickupPin, onPinChange]);

  useEffect(() => {
    onDropoffPinChange?.(dropoffPin);
  }, [dropoffPin, onDropoffPinChange]);

  useEffect(() => {
    const pickupWait = Math.max(2, Math.min(8, Math.round(etaMins / 4) || 3));
    onMapLabelsChange?.({
      pickup: "Pickup",
      dropoff: dropoff.trim() || "Drop-off",
      etaMins: pickupWait,
    });
  }, [dropoff, etaMins, onMapLabelsChange]);

  useEffect(() => {
    const q = dropoff.trim();
    if (!dropFocused || dropoffPin || q.length < 2) {
      setDropHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchAddressesAction(q, countryCode, pickupPin)
        .then((res) => setDropHits(res.results))
        .catch(() => setDropHits([]));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [dropoff, dropFocused, dropoffPin, countryCode, pickupPin]);

  useEffect(() => {
    if (searchNonce < 1) return;
    setDropoff("");
    setDropoffPin(null);
    setQuoteReady(false);
    onSnap?.("full");
  }, [searchNonce]);

  useEffect(() => {
    if (!pickupPin || !dropoffPin) {
      setQuoteReady(false);
      return;
    }
    let cancelled = false;
    void quoteFareAction({
      vehicle: "sedan",
      service_type: "ride",
      country_code: countryCode,
      pickup_lat: pickupPin.lat,
      pickup_lng: pickupPin.lng,
      dropoff_lat: dropoffPin.lat,
      dropoff_lng: dropoffPin.lng,
      at: whenLater ? localInputToIso(scheduledLocal) : null,
      customer_phone: phone || null,
    })
      .then((fare) => {
        if (cancelled) return;
        setFee(fare.fee_amount);
        setEtaMins(etaMinutes(fare.distance_km || 0));
        setQuoteReady(fare.quote_ready);
        onSnap?.("mid");
      })
      .catch(() => {
        if (!cancelled) setQuoteReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickupPin, dropoffPin, whenLater, scheduledLocal, countryCode, phone]);

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
      fee_amount: fee,
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
    void (async () => {
      setPending(true);
      try {
        saveGuest();
        const result = await createCashJobResult(buildDraft());
        if (!result.ok) {
          setMsg(result.error);
          setPending(false);
          return;
        }
        window.location.assign(`/trip/${result.job.reference_code}`);
      } catch (err) {
        setMsg(
          err instanceof Error ? err.message : "Could not book. Use WhatsApp.",
        );
        setPending(false);
      }
    })();
  }

  const estimate = fee;
  const searching = !dropoffPin;
  const etaLabel = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + etaMins);
    try {
      const time = d.toLocaleTimeString("en-ZA", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${time} · ${etaMins} min`;
    } catch {
      return `${etaMins} min`;
    }
  })();

  function pickDestination(place: PlaceSuggestion) {
    setDropoff(place.name);
    setDropHits([]);
    setDropFocused(false);
    dropoffRef.current?.blur();
    if (place.lat != null && place.lng != null) {
      setDropoffPin({ lat: place.lat, lng: place.lng });
      onSnap?.("mid");
    }
  }

  function pickAddress(hit: AddressSuggestion) {
    setDropoff(hit.label);
    setDropoffPin({ lat: hit.lat, lng: hit.lng });
    setDropHits([]);
    setDropFocused(false);
    dropoffRef.current?.blur();
    onSnap?.("mid");
  }

  async function confirmTypedDropoff() {
    const q = dropoff.trim();
    if (q.length < 2) return;
    try {
      const res = await searchAddressesAction(q, countryCode, pickupPin);
      const hit = res.results[0];
      if (hit) pickAddress(hit);
    } catch {
      /* keep typing — landmarks may still appear */
    }
  }
  const wa = bookingWhatsAppHref({
    service_type: "ride",
    pickup_landmark: pickup || "—",
    dropoff_landmark: dropoff || "—",
    customer_name: name || "—",
    customer_phone: phone || "—",
    detailsLine: whenLater ? "Reserve" : "Trip now",
    paymentLabel: payMethod === "card" ? "Card" : "Cash",
    estimateZar: estimate,
    currencySymbol: country.currencySymbol,
  });

  const cardPay = (
    <SafeCardPay
      amount={estimate}
      description="Village Ride · Trip"
      disabled={!ready}
      submitLabel="Choose Village Ride"
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
  );

  const bookCashBtn = (
    <button
      type="button"
      data-testid="book-button"
      disabled={pending}
      onClick={bookCash}
      className="uber-press min-w-0 w-full flex-1 rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
    >
      Choose Village Ride · {formatMoney(estimate, country.currency, countryCode)}
    </button>
  );

  const laterBtn = (
    <button
      type="button"
      aria-label="Schedule for later"
      onClick={() => setWhenLater(true)}
      className="uber-press flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border border-black bg-white text-black"
    >
      <CalendarClock className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );

  return (
    <div className="space-y-3 text-black">
      <WhereToBar
        onSwap={() => {
          const p = pickup;
          const pp = pickupPin;
          setPickup(dropoff);
          setPickupPin(dropoffPin);
          setDropoff(p);
          setDropoffPin(pp);
        }}
        pickupSlot={
          <input
            data-testid="pickup-input"
            className="w-full bg-transparent text-[17px] font-bold text-black outline-none ring-0 placeholder:font-normal placeholder:text-[#A6A6A6] focus:outline-none focus:ring-0 focus-visible:outline-none"
            placeholder="Current location"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          />
        }
        dropoffSlot={
          <input
            ref={dropoffRef}
            data-testid="dropoff-input"
            className="w-full bg-transparent text-[17px] font-bold text-black outline-none ring-0 placeholder:font-normal placeholder:text-[#A6A6A6] focus:outline-none focus:ring-0 focus-visible:outline-none"
            placeholder="Where to?"
            value={dropoff}
            onChange={(e) => {
              setDropoff(e.target.value);
              if (dropoffPin) {
                setDropoffPin(null);
                setQuoteReady(false);
              }
            }}
            onFocus={() => {
              setDropFocused(true);
              onSnap?.("full");
            }}
            onBlur={() => {
              window.setTimeout(() => setDropFocused(false), 180);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void confirmTypedDropoff();
              }
            }}
          />
        }
      />

      {dropHits.length > 0 ? (
        <ul className="animate-[uberFadeIn_200ms_ease-out] divide-y divide-[#eee] overflow-hidden rounded-[14px] bg-[#F8F8F8]">
          {dropHits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickAddress(hit)}
                className="uber-press flex min-h-12 w-full items-start px-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-black">
                    {hit.label.split(",")[0]}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-[#6B6B6B]">
                    {hit.label}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {searching ? (
        <div className="animate-[uberFadeIn_200ms_ease-out]">
          <SmartSuggestions
            filter="trip"
            onSelectDestination={pickDestination}
          />
        </div>
      ) : null}

      <div className={searching ? "" : "animate-[uberFadeIn_280ms_ease-out]"}>
        <p className="mb-1 text-[22px] font-bold tracking-[-0.04em]">Choose a ride</p>
        <button
          type="button"
          className="uber-press flex w-full items-center gap-3 rounded-[14px] px-2 py-3 text-left ring-2 ring-black ring-inset"
        >
          <span className="relative h-14 w-16 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/car.png"
              alt=""
              className="h-14 w-16 object-contain"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[16px] font-bold">
              Village Ride
              <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#6B6B6B]">
                <User className="h-3.5 w-3.5" aria-hidden />
                4
              </span>
            </span>
            <span className="mt-0.5 block text-[13px] font-medium text-[#6B6B6B]">
              {quoteReady ? etaLabel : "Few min"}
            </span>
          </span>
          <span data-testid="price-display" className="shrink-0 text-right text-[16px] font-bold">
            {formatMoney(estimate, country.currency, countryCode)}
          </span>
        </button>
      </div>

      {searching || !name.trim() || !phone.trim() ? (
        <div className="grid grid-cols-2 gap-2">
          <input
            aria-label="Your name"
            className="rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            aria-label="Phone"
            className="rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none"
            placeholder={formatPhonePlaceholder(countryCode)}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
        </div>
      ) : null}

      {whenLater ? (
        <>
          <input
            type="datetime-local"
            className="w-full rounded-[12px] bg-[#F3F3F3] p-4 text-[17px] outline-none focus:outline-none focus-visible:outline-none"
            value={scheduledLocal}
            onChange={(e) => setScheduledLocal(e.target.value)}
          />
          <p data-testid="reservation-fee-line" className="text-[13px] text-[#6B6B6B]">
            Includes R10 reservation fee. Cancel free until 1 hour before.
          </p>
        </>
      ) : null}

      <PaymentSelector
        value={payMethod}
        onChange={setPayMethod}
        currencyLabel={country.currencySymbol}
        compact={!searching}
      />

      {msg ? (
        <p className="rounded-xl bg-[#fdecea] px-3 py-2 text-[13px] text-[#b01000]">
          {msg}
        </p>
      ) : null}

      {pending ? (
        <div className="rounded-[16px] bg-[#F3F3F3] px-4 py-6 text-center">
          <p className="text-[22px] font-bold">Finding your ride…</p>
          <p className="mt-1 text-[13px] text-[#6B6B6B]">
            Pinging nearby drivers
          </p>
        </div>
      ) : payMethod === "cash" ? (
        searching || whenLater ? (
          bookCashBtn
        ) : (
          <div className="flex items-end gap-2">
            {bookCashBtn}
            {laterBtn}
          </div>
        )
      ) : searching || whenLater ? (
        cardPay
      ) : (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">{cardPay}</div>
          {laterBtn}
        </div>
      )}
      {searching ? (
        <a
          href={wa}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#25D366] text-[15px] font-semibold text-white"
        >
          Or book on WhatsApp
        </a>
      ) : null}
    </div>
  );
}
