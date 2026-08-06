"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Car,
  ChevronRight,
  Clock,
  CreditCard,
  Gift,
  LifeBuoy,
  Mail,
  MapPin,
  Scale,
  Settings,
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
import { RiderPhotoField } from "@/components/rider/rider-photo-field";
import { RiderReferralCard } from "@/components/referral/rider-referral-card";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";
import { SubscribeButton } from "@/components/subscription/subscribe-button";
import { DashboardSkeleton } from "@/components/ui/skeleton";

/** Uber-style Account — profile, shortcuts, menu. */
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
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 text-left"
        >
          <h1 className="text-3xl font-bold tracking-tight text-black">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {profile?.phone
              ? `${profile.phone} · ${country.flag} ${country.name}`
              : "Add phone to save trips"}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="uber-press flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-2xl font-bold text-black"
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
        <form onSubmit={saveDetails} className="mt-6 space-y-3">
          <input
            className="ru-soft-field"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Name"
          />
          <input
            className="ru-soft-field"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder={formatPhonePlaceholder(countryCode)}
            inputMode="tel"
            required
          />
          <CountrySelector compact showLanguage={false} />
          <button type="submit" className="uber-press uber-btn-black w-full">
            Save
          </button>
          {editing && profile?.phone ? (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="uber-press uber-btn-soft w-full"
            >
              Cancel
            </button>
          ) : null}
        </form>
      ) : null}

      {profile?.phone ? (
        <div className="mt-5">
          <RiderPhotoField
            previewUrl={profile.photo_data_url}
            name={profile.name}
            phone={profile.phone}
            countryCode={profile.country_code || countryCode}
            onChange={() => refreshProfile()}
          />
        </div>
      ) : null}

      {/* Uber Account 2×2 shortcuts */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <GridTile href="/help" label="Help" Icon={LifeBuoy} />
        <GridTile href="/account/payment" label="Wallet" Icon={Wallet} />
        <GridTile href="/activity" label="Activity" Icon={Clock} />
        <GridTile href="/notifications" label="Inbox" Icon={Mail} />
      </div>

      <DriveSignupCard className="mt-4" />

      {/* Promo strip — soft Uber card */}
      <Link
        href="/account/payment"
        className="uber-press mt-4 flex items-center gap-3 rounded-2xl bg-gray-50 p-4 hover:bg-gray-100"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
          <Gift className="h-5 w-5 text-black" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-black">
            Village Pass
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">
            Waive the platform fee · driver keeps the fare
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Link>

      <div className="mt-3">
        <SubscribeButton compact />
      </div>

      {profile?.phone ? (
        <div className="mt-3">
          <RiderReferralCard />
        </div>
      ) : null}

      <ul className="mt-6">
        <ListRow href="/account/places" label="Saved places" Icon={MapPin} />
        <ListRow
          href="/account/payment"
          label="Payment methods"
          Icon={CreditCard}
        />
        <ListRow href="/driver/join" label="Drive with Village Ride" Icon={Car} />
        <ListRow
          href="/onboarding?replay=1"
          label="Settings"
          Icon={Settings}
        />
        <ListRow href="/terms" label="Legal" Icon={Scale} />
        <ListRow href="/help" label="Support" Icon={LifeBuoy} />
      </ul>

      {profile?.phone ? (
        <button
          type="button"
          onClick={logout}
          className="uber-press mt-8 w-full py-3 text-center text-sm font-semibold text-gray-600 hover:text-black"
        >
          Sign out
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
      className="uber-press flex min-h-[4.5rem] flex-col justify-between rounded-2xl bg-gray-100 p-4 hover:bg-gray-200 active:bg-gray-300"
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
        className="uber-press flex min-h-14 w-full items-center gap-4 border-b border-gray-100 py-4 last:border-b-0 active:bg-gray-50"
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
