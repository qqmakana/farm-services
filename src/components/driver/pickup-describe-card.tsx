/** Prominent landmark description for drivers (no GPS required). */

export function PickupDescribeCard({
  pickup,
  dropoff,
  photoUrl,
}: {
  pickup: string;
  dropoff?: string | null;
  photoUrl?: string | null;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-[#f5f5f5] px-3 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        Pickup — find by description
      </p>
      <p className="mt-1 text-base font-bold leading-snug text-black">
        {pickup}
      </p>
      {dropoff ? (
        <p className="mt-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-500">Dropoff:</span>{" "}
          {dropoff}
        </p>
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
        Use local knowledge, ask villagers, or call the rider if needed. GPS pin
        is optional.
      </p>
    </div>
  );
}
