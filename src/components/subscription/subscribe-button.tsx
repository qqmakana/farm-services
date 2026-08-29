"use client";

import { useState, useTransition } from "react";
import { createPayPalSubscriptionAction } from "@/lib/actions-subscription";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import { useSubscription } from "@/hooks/use-subscription";
export function SubscribeButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { countryCode } = useCountry();
  const { isSubscribed, expiresAt, savings, loading, refresh } =
    useSubscription();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function subscribe() {
    setError(null);
    setNote(null);
    const guest = getGuestProfile();
    if (!guest?.phone) {
      setError("Add your phone in Account first, then subscribe.");
      return;
    }
    start(async () => {
      try {
        const res = await createPayPalSubscriptionAction({
          phone: guest.phone,
          countryCode: guest.country_code || countryCode,
          name: guest.name,
        });
        if (res.message) setNote(res.message);
        if (res.mode === "local") {
          await refresh();
          return;
        }
        window.location.href = res.approveUrl;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start Village Pass");
      }
    });
  }

  if (loading) {
    return (
      <div className="ru-card p-4 text-sm text-[var(--ru-muted)]">
        Checking Village Pass…
      </div>
    );
  }

  if (isSubscribed) {
    const saved = savings?.savedThisMonthZar ?? 0;
    const trips = savings?.tripsThisMonth ?? 0;
    return (
      <div
        data-testid="village-pass"
        data-subscription-status="active"
        className="ru-card border-[var(--ru-accent)] p-4"
      >
        <p
          data-testid="subscription-status"
          className="text-sm font-bold text-black"
        >
          Village Pass active
        </p>
        <p className="mt-1 text-xs text-[var(--ru-muted)]">
          Priority matching · free cancel
          {expiresAt
            ? ` · renews ${expiresAt.toLocaleDateString("en-ZA")}`
            : ""}
        </p>
        <div className="mt-3 rounded-xl bg-[var(--ru-elevated)] px-3 py-2.5">
          <p className="text-xs font-semibold text-black">
            You saved R{saved} this month
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--ru-muted)]">
            {trips} Village Ride trip{trips === 1 ? "" : "s"} · driver still
            keeps 90%
          </p>
          {(savings?.savedLifetimeZar ?? 0) > saved ? (
            <p className="mt-1 text-[11px] text-[var(--ru-muted)]">
              Lifetime saved: R{savings?.savedLifetimeZar}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="village-pass"
      className={`ru-card space-y-3 ${compact ? "p-4" : "p-5"}`}
    >
      <div data-testid="subscription-benefits">
        <p className="ru-section-label">Village Pass</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-black">
          Priority matching
        </p>
        <p className="mt-1 text-xs text-[var(--ru-muted)]">
          On Village Ride — Trip, Fetch, Send and Shops. Fares stay the
          same: driver keeps 90%, Village Ride 10%. Cash or card (PayPal).
        </p>
        <ul className="mt-2 space-y-1 text-xs text-[var(--ru-muted)]">
          <li>✓ Priority matching</li>
          <li>✓ Free cancellations</li>
          <li>✓ Works with cash and card</li>
        </ul>
      </div>
      {error ? (
        <p className="rounded-xl bg-[#fdecea] px-3 py-2 text-xs text-[#b01000]">
          {error}
        </p>
      ) : null}
      {note ? (
        <p className="rounded-xl bg-[var(--ru-elevated)] px-3 py-2 text-xs text-black">
          {note}
        </p>
      ) : null}
      <button
        type="button"
        data-testid="subscribe-button"
        disabled={pending}
        onClick={subscribe}
        className="uber-press uber-btn-black w-full"
      >
        {pending ? "Starting PayPal…" : "Get Village Pass"}
      </button>
      <p className="text-[11px] text-[var(--ru-muted)]">
        PayPal on the web. Cancel anytime in PayPal. Does not discount the
        driver fare.
      </p>
    </div>
  );
}
