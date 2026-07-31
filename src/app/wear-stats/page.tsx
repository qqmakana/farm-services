import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CopySocialCaption } from "@/components/wear/copy-social-caption";
import { BRAND } from "@/lib/brand";
import { getWearStats } from "@/lib/wear-stats";

export const metadata = {
  title: `Wear Stats — ${BRAND.appName}`,
  description:
    "Playful Village Ride outfit stats — most worn brands, country trends, and ready-to-post captions.",
};

export const dynamic = "force-dynamic";

export default async function WearStatsPage() {
  const stats = await getWearStats();
  const maxBrand = Math.max(1, ...stats.brandRankings.map((b) => b.count));

  return (
    <>
      <SiteNav />
      <main className="ru-force-light min-h-dvh bg-gradient-to-b from-[#f5f5f5] via-white to-white text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Wear Check
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-black sm:text-4xl">
            What riders are wearing
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Optional outfit notes help drivers spot you at the landmark — and
            power this playful brand leaderboard.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Logged today"
              value={String(stats.todayTotal)}
            />
            <StatCard
              label="Most worn today"
              value={stats.mostWornBrandToday ?? "—"}
            />
            <StatCard
              label="This week"
              value={String(stats.weekTotal)}
            />
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-black">Brand rankings</h2>
            <p className="mt-1 text-sm text-slate-600">
              Nike, Adidas, Puma and friends — counted from ride outfit notes.
            </p>
            <ul className="mt-4 space-y-3">
              {stats.brandRankings.length === 0 ? (
                <li className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  No wear logs yet. Book a ride and add what you&apos;re wearing.
                </li>
              ) : (
                stats.brandRankings.map((row, i) => (
                  <li
                    key={row.brand}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-black">
                        #{i + 1} {row.brand}
                      </span>
                      <span className="text-slate-500">{row.count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{
                          width: `${Math.round((row.count / maxBrand) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-black">Wear of the Week</h2>
            {stats.wearOfTheWeek ? (
              <>
                <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-black">
                  “{stats.wearOfTheWeek.description}”
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {stats.wearOfTheWeek.brand} · logged{" "}
                  {stats.wearOfTheWeek.count} time
                  {stats.wearOfTheWeek.count === 1 ? "" : "s"} this week
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Waiting for the first outfit of the week.
              </p>
            )}
            {stats.mostCommonOutfit &&
            stats.mostCommonOutfit !== stats.wearOfTheWeek?.description ? (
              <p className="mt-4 text-sm text-slate-600">
                Most common description:{" "}
                <span className="font-semibold text-black">
                  {stats.mostCommonOutfit}
                </span>
              </p>
            ) : null}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-black">Country trends</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {stats.countryTrends.length === 0 ? (
                <li className="text-sm text-slate-500">No country data yet.</li>
              ) : (
                stats.countryTrends.map((c) => (
                  <li
                    key={c.country}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-black">
                      {c.flag} {c.country}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Top brand: <strong>{c.topBrand}</strong> · {c.count} logs
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl bg-black px-5 py-6 text-white">
            <h2 className="text-lg font-bold">Ready to post</h2>
            <p className="mt-3 text-base leading-relaxed text-white/90">
              {stats.socialCaption}
            </p>
            <CopySocialCaption caption={stats.socialCaption} />
          </section>

          <p className="mt-10 text-center text-sm text-slate-500">
            <Link href="/ride" className="font-semibold text-black underline">
              Book a ride
            </Link>
            {" · add what you’re wearing"}
          </p>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-black">
        {value}
      </p>
    </div>
  );
}
