/** Pickup / dropoff for drivers — landmark, address text, and optional Maps. */

function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function PickupDescribeCard({
  pickup,
  dropoff,
  photoUrl,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
}: {
  pickup: string;
  dropoff?: string | null;
  photoUrl?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
}) {
  const hasPickupPin =
    typeof pickupLat === "number" && typeof pickupLng === "number";
  const hasDropoffPin =
    typeof dropoffLat === "number" && typeof dropoffLng === "number";

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
      ) : null}
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
      <p className="mt-2 text-[11px] text-slate-500">
        Use the pin when it helps; otherwise find by description. Ask locals or
        call the rider if needed.
      </p>
    </div>
  );
}
