import Link from "next/link";
import { getPlatformTrustStats } from "@/lib/actions-ops";

/** Live trust strip — Uber-clean stats row. */
export async function TrustBadges() {
  const stats = await getPlatformTrustStats();

  const items = [
    { label: "Deliveries", value: `${stats.deliveriesCompleted}+` },
    { label: "Verified drivers", value: `${stats.verifiedDrivers}+` },
    { label: "Avg rating", value: `${stats.avgRating}★` },
  ];

  return (
    <section className="ru-card p-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-black">
              {item.value}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[var(--ru-muted)]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-[var(--ru-muted)]">
        Cash &amp; card ·{" "}
        <Link href="/pricing" className="font-semibold text-black underline">
          See pricing
        </Link>
      </p>
    </section>
  );
}
