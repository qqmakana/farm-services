"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { getMerchantReferralDashboard } from "@/lib/actions-ops";
import { WhatsAppLinks } from "@/lib/whatsapp-links";

type Dash = NonNullable<Awaited<ReturnType<typeof getMerchantReferralDashboard>>>;

export default function MerchantReferralsPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getMerchantReferralDashboard()
      .then((d) => {
        if (!d) setError("Sign in as a merchant first.");
        else setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (error) {
    return (
      <>
        <SiteNav active="shop" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-sm text-slate-600">{error}</p>
          <Link href="/login?next=/merchant/referrals" className="mt-4 inline-block text-[#1A4D3A] underline">
            Sign in
          </Link>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SiteNav active="shop" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center text-sm text-slate-500">
          Loading referrals…
        </main>
      </>
    );
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://village-ride.vercel.app";
  const shareUrl = `${origin}/shop?ref=${data.shop.referral_code ?? ""}`;
  const code = data.shop.referral_code ?? "";

  return (
    <>
      <SiteNav active="shop" />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-20">
        <h1 className="text-2xl font-bold">Referral dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Earn R50 per active partner who joins with your code.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Sent" value={String(data.stats.sent)} />
          <Stat label="Converted" value={String(data.stats.converted)} />
          <Stat label="Bonus earned" value={`R${data.stats.bonusEarned}`} />
          <Stat label="Pending" value={`R${data.stats.pendingBonus}`} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-xs font-semibold"
            onClick={() => void navigator.clipboard.writeText(shareUrl)}
          >
            Copy link
          </button>
          <a
            href={WhatsAppLinks.inviteBusiness(shareUrl, code)}
            className="rounded-lg border px-3 py-2 text-xs font-semibold"
          >
            Share WhatsApp
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(`Join Village Ride with code ${code}: ${shareUrl}`)}`}
            className="rounded-lg border px-3 py-2 text-xs font-semibold"
          >
            Share SMS
          </a>
        </div>

        <section className="mt-8">
          <h2 className="font-bold">History</h2>
          <ul className="mt-3 space-y-2">
            {data.referred.length === 0 ? (
              <li className="text-sm text-slate-500">No referrals yet.</li>
            ) : (
              data.referred.map((r) => (
                <li key={r.id} className="rounded-lg border bg-white px-3 py-2 text-sm">
                  <strong>{r.name}</strong> · {r.status} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-bold">Leaderboard</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
            {data.leaderboard.map((row) => (
              <li key={row.name}>
                {row.name} — {row.count}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <p className="text-[10px] font-semibold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#1A4D3A]">{value}</p>
    </div>
  );
}
