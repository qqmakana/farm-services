import { listOpenFuelRequestsForOps } from "@/lib/actions-fuel";

export async function FuelOpsStrip() {
  let rows: Awaited<ReturnType<typeof listOpenFuelRequestsForOps>> = [];
  try {
    rows = await listOpenFuelRequestsForOps();
  } catch {
    return null;
  }
  if (rows.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
      <h2 className="text-sm font-bold text-amber-950">
        ⛽ Open fuel help ({rows.length})
      </h2>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-800"
          >
            <span className="font-semibold">{r.fuel_amount}</span>
            {" · "}
            <span className="uppercase text-xs font-semibold text-amber-900">
              {r.status}
            </span>
            {r.location_landmark ? ` · ${r.location_landmark}` : ""}
            <span className="block text-xs text-slate-500">
              Cash to helper · {new Date(r.created_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
