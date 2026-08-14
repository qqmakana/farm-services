/** Pickup / dropoff for drivers — landmark, address text, Maps, Call / Message rider. */

import { TripQuickReplies } from "@/components/trip/trip-quick-replies";
import {
  DRIVER_QUICK_REPLIES,
  tripWhatsAppHref,
} from "@/lib/trip-quick-replies";

function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function PickupDescribeCard({
  pickup,
  dropoff,
  photoUrl,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  customerPhone,
  customerName,
  countryCode,
}: {
  pickup: string;
  dropoff?: string | null;
  photoUrl?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  customerPhone?: string | null;
  customerName?: string | null;
  countryCode?: string | null;
}) {
  const hasPickupPin =
    typeof pickupLat === "number" && typeof pickupLng === "number";
  const hasDropoffPin =
    typeof dropoffLat === "number" && typeof dropoffLng === "number";
  const callHref = customerPhone ? telHref(customerPhone) : null;
  const messageHref = tripWhatsAppHref(
    customerPhone,
    `Hi ${customerName?.trim() || "there"} — I'm your Village Ride driver. I'm heading to ${pickup}.`,
    countryCode,
  );

  return (
    <div className="rounded-xl border border-black/10 bg-[#f5f5f5] px-3 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        Pickup — address or landmark
      </p>
      <p className="mt-1 text-base font-bold leading-snug text-black">
        {pickup}
      </p>
      {hasPickupPin ? (
        <a
          href={mapsHref(pickupLat!, pickupLng!)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs font-semibold text-black underline underline-offset-2"
        >
          Open pickup in Maps
        </a>
      ) : (
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          No GPS pin — find by this description
        </p>
      )}
      {dropoff ? (
        <div className="mt-2">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Dropoff:</span>{" "}
            {dropoff}
          </p>
          {hasDropoffPin ? (
            <a
              href={mapsHref(dropoffLat!, dropoffLng!)}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-block text-xs font-semibold text-black underline underline-offset-2"
            >
              Open dropoff in Maps
            </a>
          ) : null}
        </div>
      ) : null}
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt="Pickup spot"
          className="mt-3 max-h-40 w-full rounded-lg object-cover"
        />
      ) : null}

      <div className="mt-3 flex gap-2">
        {callHref ? (
          <a
            href={callHref}
            className="uber-press flex flex-1 items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white"
          >
            Call {customerName?.trim() || "rider"}
          </a>
        ) : null}
        {messageHref ? (
          <a
            href={messageHref}
            target="_blank"
            rel="noreferrer"
            className="uber-press flex flex-1 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black ring-1 ring-gray-200"
          >
            Message
          </a>
        ) : null}
      </div>

      {customerPhone ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold text-slate-500">
            Quick message
          </p>
          <TripQuickReplies
            phone={customerPhone}
            countryCode={countryCode}
            replies={DRIVER_QUICK_REPLIES}
          />
        </div>
      ) : null}

      <p className="mt-2 text-[11px] text-slate-500">
        Description works offline and without GPS. Call or message the rider if
        you can&apos;t find the place.
      </p>
    </div>
  );
}
