import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { getAdminSignupsData } from "@/lib/actions-ops";

export const dynamic = "force-dynamic";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminSignupsPage() {
  const { gate, drivers, riders } = await getAdminSignupsData();

  if (!gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin only</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your admin email to see who signed up.
          </p>
          <Link
            href="/login?next=/admin/signups"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Private · only you
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Signups</h1>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {gate.email}. Drivers who applied, and riders who booked
          a trip.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-black">
            Drivers ({drivers.length})
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            From the apply form on /driver/join
          </p>
          {drivers.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No driver applications yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {drivers.map((d) => (
                <li key={d.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-black">{d.full_name}</p>
                      <p className="text-sm text-slate-600">{d.phone}</p>
                      {d.notes ? (
                        <p className="mt-1 text-xs text-slate-500">{d.notes}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-800">
                          {d.verification_status || "—"}
                        </span>{" "}
                        · {d.approval_status || "—"}
                      </p>
                      <p className="mt-1">{formatWhen(d.created_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-black">
            Riders who booked ({riders.length})
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            From trip bookings — name and phone on each job
          </p>
          {riders.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No rider bookings yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {riders.map((r) => (
                <li
                  key={r.customer_phone}
                  className="flex flex-wrap items-start justify-between gap-2 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-black">{r.customer_name}</p>
                    <p className="text-sm text-slate-600">{r.customer_phone}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>
                      {r.trips} trip{r.trips === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1">Last: {formatWhen(r.last_trip_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/admin/dashboard" className="font-semibold text-black underline">
            Admin dashboard
          </Link>
          {" · "}
          <Link href="/admin/verifications" className="font-semibold text-black underline">
            ID checks
          </Link>
          {" · "}
          <Link href="/dispatch" className="font-semibold text-black underline">
            Dispatch
          </Link>
        </p>
      </main>
    </>
  );
}
