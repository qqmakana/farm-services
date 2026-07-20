import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { getAdminAnalyticsData } from "@/lib/actions-ops";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalyticsData();
  if (!data.gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link href="/login?next=/admin/analytics" className="mt-6 inline-block text-[#1A4D3A] underline">
            Sign in
          </Link>
        </main>
      </>
    );
  }

  const summary = data.summary!;
  const ops = data.ops!;

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-4xl px-4 py-8 pb-20">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Free-tier Supabase events (no paid analytics).
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Page views today" value={String(summary.pageViewsToday)} />
          <Card label="Events today" value={String(summary.eventsToday)} />
          <Card label="Orders today" value={String(ops.ordersToday)} />
          <Card label="Drivers online" value={String(ops.onlineDrivers)} />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="font-bold">Top pages (7d)</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {summary.topPages.map((p) => (
                <li key={p.name}>
                  {p.name} · {p.count}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-bold">Top events</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {summary.topEvents.map((p) => (
                <li key={p.name}>
                  {p.name} · {p.count}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="font-bold">Popular routes</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {ops.popularRoutes.length === 0 ? (
              <li className="text-slate-500">No completed routes yet.</li>
            ) : (
              ops.popularRoutes.map((r) => (
                <li key={r.route}>
                  {r.route} · {r.count}
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Referral events tracked: {ops.referralEvents}
          </p>
        </section>
      </main>
    </>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1A4D3A]">{value}</p>
    </div>
  );
}
