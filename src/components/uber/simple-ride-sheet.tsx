"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, Search, User, Zap } from "lucide-react";
import {
  PaymentSelector,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-selector";
import { useCountry } from "@/components/country/country-provider";
import { PlanYourRideHeader } from "@/components/uber/plan-your-ride-header";
import { SafeCardPay } from "@/components/uber/safe-card-pay";
import { localInputToIso, toLocalInputValue } from "@/components/uber/schedule-when";
import { WhereToBar } from "@/components/uber/where-to-bar";
import { PhoneDigitHint } from "@/components/ui/phone-digit-hint";
import {
  capturePayPalAndCreateJob,
  createCashJobResult,
  createLocalPaidJob,
  createPayPalOrderAction,
  quoteFareAction,
} from "@/lib/actions";
import { reverseGeocodeAction, searchAddressesAction } from "@/lib/actions-mapbox";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import { formatMoney } from "@/lib/format";
import { etaMinutes } from "@/lib/geo";
import { getGuestProfile, setGuestProfile } from "@/lib/guest-profile";
import type { AddressSuggestion } from "@/lib/mapbox-types";
import { isValidMobileForCountry, phoneDigitFeedback } from "@/lib/phone";
import { getCapturedReferrer } from "@/lib/rider-referral";
import { stashPaypalApproveUrl, stashPaypalBooking } from "@/lib/paypal-draft";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import type { PlaceSuggestion } from "@/lib/suggestions";
import {
  normalizeTripSeats,
  tripStopFeeAmount,
  type TripSeats,
} from "@/lib/pricing";
import { TRIP_STOP_TYPES, type TripStopType } from "@/lib/fares";
import { SERVICE_COPY } from "@/lib/service-guide";
import type { NewJobInput, RideProductTier } from "@/lib/types";

type Pin = { lat: number; lng: number };
type Draft = Omit<NewJobInput, "payment">;

const RIDE_OPTIONS: {
  id: RideProductTier;
  name: string;
  tag: string;
  seats: TripSeats;
  /** Extra minutes vs base trip ETA (dynamic). */
  etaOffset: number;
  waitRange?: boolean;
  carScale: "sm" | "md" | "lg";
}[] = [
  {
    id: "singles",
    name: "Singles",
    tag: "Faster",
    seats: 1,
    etaOffset: 0,
    carScale: "md",
  },
  {
    id: "married",
    name: "Married",
    tag: "Comfort",
    seats: 2,
    etaOffset: 2,
    carScale: "lg",
  },
  {
    id: "grannies",
    name: "Grannies",
    tag: "Priority",
    seats: 4,
    etaOffset: 4,
    waitRange: true,
    carScale: "md",
  },
];

/** Arrival clock + wait label from trip distance ETA + tier offset. */
function formatEtaFromDistance(
  tripEtaMins: number,
  etaOffset: number,
  waitRange?: boolean,
): string {
  const wait = Math.max(3, tripEtaMins + etaOffset);
  const d = new Date();
  d.setMinutes(d.getMinutes() + wait);
  const rangeLabel = waitRange
    ? `${Math.max(3, wait - 2)} - ${wait + 5} min`
    : `${wait} min`;
  try {
    const time = d.toLocaleTimeString("en-ZA", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${time} · ${rangeLabel}`;
  } catch {
    return rangeLabel;
  }
}

function shortStreet(full: string): string {
  const first = full.split(",")[0]?.trim() || full;
  return first.length > 36 ? `${first.slice(0, 34)}…` : first;
}

/**
 * Trip / Reserve form for older Android WebViews (Hisense).
 * Card (Yoco) loads only after Card is selected. No Mapbox search widget.
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
  const [fee, setFee] = useState(country.pricing?.ride?.base ?? 10);
  const [etaMins, setEtaMins] = useState(7);
  const [quoteReady, setQuoteReady] = useState(false);
  const [dropHits, setDropHits] = useState<AddressSuggestion[]>([]);
  const [dropFocused, setDropFocused] = useState(false);
  const [productTier, setProductTier] = useState<RideProductTier>("singles");
  const [extraStop, setExtraStop] = useState(false);
  const [stopType, setStopType] = useState<TripStopType>("spaza");
  const [stopFee, setStopFee] = useState(0);
  const dropoffRef = useRef<HTMLInputElement>(null);

  const selected = RIDE_OPTIONS.find((o) => o.id === productTier) ?? RIDE_OPTIONS[0];
  const seats = selected.seats;
  const estimate = fee;

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("when") === "later") setWhenLater(true);
      if (q.get("stop") === "1") setExtraStop(true);
      const seatHint = normalizeTripSeats(q.get("seats"));
      if (seatHint === 2) setProductTier("married");
      else if (seatHint === 4) setProductTier("grannies");
      const at = q.get("at");
      if (at) {
        setWhenLater(true);
        const parsed = new Date(at);
        if (!Number.isNaN(parsed.getTime())) {
          setScheduledLocal(toLocalInputValue(parsed));
        }
      }
      const to = q.get("to");
      if (to) setDropoff(to);
      const from = q.get("from");
      if (from) setPickup(from);
      const toLat = Number(q.get("toLat"));
      const toLng = Number(q.get("toLng"));
      if (Number.isFinite(toLat) && Number.isFinite(toLng)) {
        setDropoffPin({ lat: toLat, lng: toLng });
      }
      const fromLat = Number(q.get("fromLat"));
      const fromLng = Number(q.get("fromLng"));
      if (Number.isFinite(fromLat) && Number.isFinite(fromLng)) {
        setPickupPin({ lat: fromLat, lng: fromLng });
        setPickup((p) => p.trim() || from || "Current location");
      }
    } catch {
      /* ignore */
    }
    const guest = getGuestProfile();
    if (guest?.name) setName(guest.name);
    if (guest?.phone) setPhone(guest.phone);
    const hasDest =
      Number.isFinite(Number(new URLSearchParams(window.location.search).get("toLat")));
    if (!hasDest) {
      window.setTimeout(() => dropoffRef.current?.focus(), 400);
    }
  }, []);

  useEffect(() => {
    if (!pickupPin) return;
    let cancelled = false;
    void reverseGeocodeAction(pickupPin.lat, pickupPin.lng, countryCode)
      .then((hit) => {
        if (cancelled || !hit?.label) return;
        setPickup((p) => {
          if (
            !p.trim() ||
            p === "Current location" ||
            p === "Pickup" ||
            p.toLowerCase() === "current location"
          ) {
            return shortStreet(hit.label);
          }
          return p;
        });
      })
      .catch(() => {
        /* keep existing label */
      });
    return () => {
      cancelled = true;
    };
  }, [pickupPin, countryCode]);

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
      pickup: pickup.trim() || "Pickup",
      dropoff: dropoff.trim() || "Drop-off",
      etaMins: pickupWait,
    });
  }, [pickup, dropoff, etaMins, onMapLabelsChange]);

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
    // Same fare for Singles / Married / Grannies — quote as Solo (no seat surcharge).
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
      details: {
        seats: 1,
        extra_stop_type: extraStop ? stopType : undefined,
      },
    })
      .then((fare) => {
        if (cancelled) return;
        setFee(fare.fee_amount);
        setStopFee(fare.extra_stop_fee || 0);
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
  }, [
    pickupPin,
    dropoffPin,
    whenLater,
    scheduledLocal,
    countryCode,
    phone,
    extraStop,
    stopType,
  ]);

  const phoneOk =
    phoneDigitFeedback(phone, countryCode).status === "ok" &&
    isValidMobileForCountry(phone, countryCode);
  const ready =
    Boolean(name.trim()) &&
    phoneOk &&
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
    const tierLabel = selected.name;
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
      dispatcher_notes: [
        tag,
        `Product: ${tierLabel}`,
        extraStop
          ? `Stop: ${stopType} (+${formatMoney(tripStopFeeAmount(countryCode), country.currency, countryCode)})`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || null,
      details: {
        seats: 1,
        product_tier: productTier,
        route_name: `${pickup.trim()} → ${dropoff.trim()}`,
        direction: "to_village",
        extra_stop_type: extraStop ? stopType : undefined,
        extra_stop_fee: extraStop ? tripStopFeeAmount(countryCode) : undefined,
      },
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
      setMsg("Fill name, phone, pickup and drop-off. Tap the map to set pins.");
      return;
    }
    const phoneHint = phoneDigitFeedback(phone, countryCode);
    if (phoneHint.status !== "ok" || !isValidMobileForCountry(phone, countryCode)) {
      setMsg(phoneHint.message || "Enter a valid mobile number.");
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
          err instanceof Error ? err.message : "Could not book. Try again.",
        );
        setPending(false);
      }
    })();
  }

  const searching = !dropoffPin;
  const chooseLabel = `Choose ${selected.name}`;

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

  const cardPay = (
    <SafeCardPay
      amount={estimate}
      description={`Village Ride · ${selected.name}`}
      disabled={!ready}
      submitLabel={chooseLabel}
      onCreateOrder={async () => {
        setMsg(null);
        if (!ready) throw new Error("Complete the form first.");
        saveGuest();
        const d = buildDraft();
        stashPaypalBooking(d);
        const { orderId, approveUrl } = await createPayPalOrderAction({
          vehicle: "sedan",
          service_type: "ride",
          country_code: d.country_code || countryCode,
          customer_phone: d.customer_phone,
          pickup_lat: d.pickup_lat,
          pickup_lng: d.pickup_lng,
          dropoff_lat: d.dropoff_lat,
          dropoff_lng: d.dropoff_lng,
          description: `Village Ride trip · ${selected.name}`,
          at: d.scheduled_for ?? null,
          details: d.details,
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
  );

  const bookCashBtn = (
    <button
      type="button"
      data-testid="book-button"
      disabled={pending}
      onClick={bookCash}
      className="uber-press min-w-0 w-full flex-1 rounded-full bg-black py-4 text-[17px] font-medium text-white disabled:opacity-50"
    >
      Choose {selected.name}
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
      {searching ? (
        <PlanYourRideHeader
          whenMode={whenLater ? "later" : "now"}
          onToggleWhen={() => setWhenLater((v) => !v)}
        />
      ) : null}

      <WhereToBar
        bordered={false}
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
            className="w-full bg-transparent text-[16px] font-medium tracking-[-0.2px] text-[#000000] outline-none ring-0 placeholder:font-normal placeholder:text-[#A6A6A6] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            placeholder="Current location"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          />
        }
        dropoffSlot={
          <div className="flex min-h-11 items-center gap-2">
            {searching ? (
              <Search
                className="h-4 w-4 shrink-0 text-[#6B6B6B]"
                strokeWidth={2}
                aria-hidden
              />
            ) : null}
            <input
              ref={dropoffRef}
              data-testid="dropoff-input"
              className="w-full bg-transparent text-[16px] font-medium tracking-[-0.2px] text-[#000000] outline-none ring-0 placeholder:font-normal placeholder:text-[#A6A6A6] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              placeholder="Where to?"
              value={dropoff}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
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
          </div>
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
      ) : (
      <div className="animate-[uberFadeIn_280ms_ease-out] space-y-3">
        <p className="mb-1 text-center text-[22px] font-bold tracking-[-0.04em] text-[#111111]">
          Choose a ride
        </p>

        <div data-testid="ride-product-list" className="divide-y divide-[#EEEEEE]">
          {RIDE_OPTIONS.map((opt) => {
            const active = productTier === opt.id;
            const eta = formatEtaFromDistance(
              etaMins,
              opt.etaOffset,
              opt.waitRange,
            );
            const carCls =
              opt.carScale === "lg"
                ? "h-14 w-[4.25rem]"
                : opt.carScale === "sm"
                  ? "h-12 w-14"
                  : "h-14 w-16";
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`ride-tier-${opt.id}`}
                aria-pressed={active}
                onClick={() => setProductTier(opt.id)}
                className={`uber-press flex w-full items-center gap-3 px-2 py-4 text-left ${
                  active ? "rounded-[14px] ring-2 ring-black ring-inset" : ""
                }`}
              >
                <span className="relative flex h-14 w-16 shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/home/icons/car.png"
                    alt=""
                    className={`${carCls} object-contain`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[17px] font-bold text-[#111111]">
                    {opt.name}
                    <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#6B6B6B]">
                      <User className="h-3.5 w-3.5" aria-hidden />
                      {opt.seats}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[15px] font-medium text-[#6B6B6B]">
                    {quoteReady ? eta : "Few min"}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                    <Zap
                      className="h-3 w-3 fill-white text-white"
                      strokeWidth={0}
                      aria-hidden
                    />
                    {opt.tag}
                  </span>
                </span>
                <span
                  data-testid={active ? "price-display" : undefined}
                  className="shrink-0 text-right text-[17px] font-bold text-[#111111]"
                >
                  {formatMoney(estimate, country.currency, countryCode)}
                </span>
              </button>
            );
          })}
        </div>

        <div data-testid="trip-people" className="sr-only" aria-hidden>
          <button type="button" data-testid="trip-seats-1" aria-pressed={seats === 1}>
            Solo
          </button>
          <button type="button" data-testid="trip-seats-2" aria-pressed={seats === 2}>
            2
          </button>
          <button type="button" data-testid="trip-seats-4" aria-pressed={seats === 4}>
            4
          </button>
        </div>

        <div data-testid="trip-stop" className="space-y-2">
          <p className="text-[13px] leading-snug text-[#6B6B6B]">
            {SERVICE_COPY.tripStop.tile}
          </p>
          <button
            type="button"
            aria-pressed={extraStop}
            onClick={() => setExtraStop((v) => !v)}
            className={`uber-press w-full min-h-11 rounded-full text-[15px] font-bold ${
              extraStop ? "bg-black text-white" : "bg-[#F3F3F3] text-black"
            }`}
          >
            {extraStop ? "One stop included" : "Add one stop"}
          </button>
          {extraStop ? (
            <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Stop type">
              {TRIP_STOP_TYPES.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  aria-pressed={stopType === stop.id}
                  onClick={() => setStopType(stop.id)}
                  className={`uber-press min-h-10 rounded-full px-1 text-[12px] font-semibold ${
                    stopType === stop.id
                      ? "bg-black text-white"
                      : "bg-[#F3F3F3] text-black"
                  }`}
                >
                  {stop.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {stopFee > 0 ? (
          <p data-testid="bundled-fare-note" className="text-[13px] text-[#6B6B6B]">
            One price · stop{" "}
            {formatMoney(stopFee, country.currency, countryCode)}
          </p>
        ) : null}

      {!name.trim() || !phone.trim() || phoneDigitFeedback(phone, countryCode).status !== "ok" ? (
        <div className="space-y-2">
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
              autoComplete="tel"
            />
          </div>
          <PhoneDigitHint phone={phone} countryCode={countryCode} />
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
        compact
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
        whenLater ? (
          bookCashBtn
        ) : (
          <div className="flex items-end gap-2">
            {bookCashBtn}
            {laterBtn}
          </div>
        )
      ) : whenLater ? (
        cardPay
      ) : (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">{cardPay}</div>
          {laterBtn}
        </div>
      )}
        </div>
      )}
      {searching && whenLater ? (
        <p data-testid="reservation-fee-line" className="text-[13px] text-[#6B6B6B]">
          Includes R10 reservation fee. Cancel free until 1 hour before.
        </p>
      ) : null}
    </div>
  );
}
