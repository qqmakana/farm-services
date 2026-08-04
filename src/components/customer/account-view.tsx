"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  CreditCard,
  Gift,
  LifeBuoy,
  Mail,
  MapPin,
  Scale,
  Settings,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { CountrySelector } from "@/components/country/country-selector";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import {
  clearGuestProfile,
  getGuestProfile,
  setGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";
import { RiderReferralCard } from "@/components/referral/rider-referral-card";
import { SubscribeButton } from "@/components/subscription/subscribe-button";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export function AccountView() {
  const { country, countryCode } = useCountry();
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [editing, setEditing] = useState(false);

  function refreshProfile() {
    const p = getGuestProfile();
    setProfile(p);
    if (p) {
      setNameInput(p.name);
      setPhoneInput(p.phone);
    }
  }

  useEffect(() => {
    refreshProfile();
    setHydrated(true);
  }, []);

  function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setGuestProfile({
      name: nameInput,
      phone: phoneInput,
      country_code: countryCode,
    });
    refreshProfile();
    setEditing(false);
  }

  function logout() {
    clearGuestProfile();
    setProfile(null);
    setNameInput("");
    setPhoneInput("");
    setEditing(true);
  }

  if (!hydrated) {
    return (
      <main className="min-h-dvh bg-white px-4 pb-28 pt-6">
        <DashboardSkeleton />
      </main>
    );
  }

  const displayName = profile?.name?.trim() || "Guest";
  const initial = (profile?.name || profile?.phone || "?").charAt(0).toUpperCase();
  const showForm = !profile?.phone || editing;

  return (
    <main
      data-testid="account-view"
      className="min-h-dvh touch-manipulation bg-white px-4 pb-28 pt-6"
    >
      {/* Profile header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            {displayName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {profile?.phone ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-black">
                <BadgeCheck className="h-3.5 w-3.5 text-[#0ECB81]" aria-hidden />
                Verified guest
              </span>
            ) : (
              <span className="text-sm text-gray-500">Add your phone to save trips</span>
            )}
            <span className="text-xs text-gray-500">
              {country.flag} {country.name}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xl font-bold text-black"
          aria-label="Edit profile"
        >
          {profile?.photo_data_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_data_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={saveDetails}
          className="mt-6 space-y-3 rounded-2xl bg-gray-100 p-4"
        >
          <label className="block text-sm font-semibold text-black">
            Name
            <input
              className="ru-soft-field mt-1 !bg-white"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
            />
          </label>
          <label className="block text-sm font-semibold text-black">
            Phone
            <input
              className="ru-soft-field mt-1 !bg-white"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={formatPhonePlaceholder(countryCode)}
              inputMode="tel"
              required
            />
          </label>
          <div className="pt-1">
            <CountrySelector compact showLanguage={false} />
          </div>
          <button type="submit" className="ru-btn-book ru-btn-block">
            Save profile
          </button>
          {editing && profile?.phone ? (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="ru-btn ru-btn-ghost ru-btn-block"
            >
              Cancel
            </button>
          ) : null}
        </form>
      ) : null}

      {/* 2x2 grid */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <GridTile href="/help" label="Help" Icon={LifeBuoy} />
        <GridTile href="/account/payment" label="Wallet" Icon={Wallet} />
        <GridTile href="/help" label="Safety" Icon={Shield} />
        <GridTile href="/notifications" label="Inbox" Icon={Mail} />
      </div>

      {/* Balances */}
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-gray-100 p-4">
        <div>
          <p className="text-sm font-semibold text-black">Village Ride balances</p>
          <p className="mt-0.5 text-xs text-gray-500">Cash to driver · card online</p>
        </div>
        <p className="text-lg font-bold text-black">—</p>
      </div>

      {/* Village Pass promo */}
      <div className="mt-3 rounded-2xl bg-gray-100 p-4">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
            <Gift className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-black">Village Pass</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Waive the platform fee on rides — driver still keeps the fare.
            </p>
          </div>
        </div>
        <SubscribeButton compact />
      </div>

      {profile?.phone ? (
        <div className="mt-3">
          <RiderReferralCard />
        </div>
      ) : null}

      {/* List menu */}
      <ul className="mt-6">
        <ListRow href="/account/places" label="Saved places" Icon={MapPin} />
        <ListRow
          href="/account/payment"
          label="Payment methods"
          Icon={CreditCard}
        />
        <ListRow href="/help" label="Refer friends" Icon={Users} />
        <ListRow
          href="/onboarding?replay=1"
          label="Settings & tour"
          Icon={Settings}
        />
        <ListRow href="/terms" label="Legal" Icon={Scale} />
      </ul>

      {profile?.phone ? (
        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full py-3 text-center text-sm font-semibold text-rose-600"
        >
          Log out
        </button>
      ) : null}
    </main>
  );
}

function GridTile({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: typeof Wallet;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[3.5rem] cursor-pointer items-center gap-3 rounded-2xl bg-gray-100 p-4 transition-all duration-150 ease-out hover:bg-gray-200 hover:shadow-md active:scale-[0.98] active:bg-gray-300"
    >
      <Icon className="h-5 w-5 text-black" aria-hidden />
      <span className="text-sm font-semibold text-black">{label}</span>
    </Link>
  );
}

function ListRow({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: typeof MapPin;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-14 w-full cursor-pointer items-center gap-4 border-b border-gray-100 py-4 transition-colors duration-150 ease-out last:border-b-0 hover:bg-gray-50 active:bg-gray-100"
      >
        <Icon className="h-5 w-5 shrink-0 text-black" aria-hidden />
        <span className="flex-1 text-left text-base font-medium text-black">
          {label}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
      </Link>
    </li>
  );
}
