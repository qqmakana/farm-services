import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
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
      <main className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] text-[var(--ru-ink)]">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-24">
          <p className="ru-section-label">Wear Check</p>
          <h1 className="ru-page-title mt-2 !text-[1.85rem] sm:!text-[2.25rem]">
            What riders are wearing
          </h1>
          <p className="ru-page-sub max-w-2xl">
            Optional outfit notes help drivers spot you at the landmark — and
            power this playful brand leaderboard.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard label="Logged today" value={String(stats.todayTotal)} />
            <StatCard
              label="Most worn today"
              value={stats.mostWornBrandToday ?? "—"}
            />
            <StatCard label="This week" value={String(stats.weekTotal)} />
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-[var(--ru-ink)]">
              Brand rankings
            </h2>
            <p className="mt-1 text-sm text-[var(--ru-muted)]">
              Nike, Adidas, Puma and friends — counted from ride outfit notes.
            </p>
            <ul className="mt-4 space-y-3">
              {stats.brandRankings.length === 0 ? (
                <li className="ru-card px-4 py-6 text-sm text-[var(--ru-muted)]">
                  No wear logs yet. Book a ride and add what you&apos;re wearing.
                </li>
              ) : (
                stats.brandRankings.map((row, i) => (
                  <li key={row.brand} className="ru-card px-4 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[var(--ru-ink)]">
                        #{i + 1} {row.brand}
                      </span>
                      <span className="text-[var(--ru-muted)]">{row.count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ru-elevated)]">
                      <div
                        className="h-full rounded-full bg-[var(--ru-accent)]"
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

          <section className="ru-card mt-10 p-5">
            <h2 className="text-lg font-bold text-[var(--ru-ink)]">
              Wear of the Week
            </h2>
            {stats.wearOfTheWeek ? (
              <>
                <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ru-ink)]">
                  “{stats.wearOfTheWeek.description}”
                </p>
                <p className="mt-2 text-sm text-[var(--ru-muted)]">
                  {stats.wearOfTheWeek.brand} · logged{" "}
                  {stats.wearOfTheWeek.count} time
                  {stats.wearOfTheWeek.count === 1 ? "" : "s"} this week
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--ru-muted)]">
                Waiting for the first outfit of the week.
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-[var(--ru-ink)]">
              Country trends
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {stats.countryTrends.length === 0 ? (
                <li className="text-sm text-[var(--ru-muted)]">
                  No country data yet.
                </li>
              ) : (
                stats.countryTrends.map((c) => (
                  <li key={c.country} className="ru-card px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--ru-ink)]">
                      {c.flag} {c.country}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ru-muted)]">
                      Top brand: <strong>{c.topBrand}</strong> · {c.count} logs
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="mt-10 rounded-[var(--ru-radius)] bg-[var(--ru-black)] px-5 py-6 text-white">
            <h2 className="text-lg font-bold">Ready to post</h2>
            <p className="mt-3 text-base leading-relaxed text-white/90">
              {stats.socialCaption}
            </p>
            <CopySocialCaption caption={stats.socialCaption} />
          </section>

          <p className="mt-10 text-center text-sm text-[var(--ru-muted)]">
            <Link href="/ride" className="font-semibold text-black underline">
              Book a ride
            </Link>
            {" · add what you’re wearing"}
          </p>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ru-card px-4 py-4">
      <p className="ru-section-label">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ru-ink)]">
        {value}
      </p>
    </div>
  );
}
