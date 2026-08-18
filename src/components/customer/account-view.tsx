"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ALargeSmall,
  BadgeCheck,
  Briefcase,
  Car,
  ChevronRight,
  Leaf,
  LifeBuoy,
  Mail,
  MapPin,
  Scale,
  Settings,
  Shield,
  Star,
  Store,
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
import { RiderPhotoField } from "@/components/rider/rider-photo-field";
import { RiderReferralCard } from "@/components/referral/rider-referral-card";
import { SubscribeButton } from "@/components/subscription/subscribe-button";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { readSavedPlacesCache } from "@/lib/saved-places-cache";
import {
  applySimpleModeClass,
  isSimpleMode,
  setSimpleMode,
} from "@/lib/simple-mode";

/** Uber-style Account — split name, shortcuts, banners, menu. */
export function AccountView() {
  const { country, countryCode } = useCountry();
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [simple, setSimple] = useState(false);
  const [placeCount, setPlaceCount] = useState(0);

  function refreshProfile() {
    const p = getGuestProfile();
    setProfile(p);
    if (p) {
      setNameInput(p.name);
      setPhoneInput(p.phone);
      setPlaceCount(readSavedPlacesCache(p.phone).length);
    } else {
      setPlaceCount(0);
    }
  }

  useEffect(() => {
    refreshProfile();
    applySimpleModeClass();
    setSimple(isSimpleMode());
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

  function toggleSimple() {
    const next = !simple;
    setSimpleMode(next);
    setSimple(next);
  }

  const displayName = profile?.name?.trim() || "Guest";
  const nameParts = displayName.split(/\s+/);
  const firstName = nameParts[0] || "Guest";
  const lastName = nameParts.slice(1).join(" ");
  const initial = (profile?.name || profile?.phone || "?").charAt(0).toUpperCase();
  const showForm = !profile?.phone || editing;

  const safetyDone = useMemo(() => {
    const checks = [
      Boolean(profile?.phone),
      Boolean(profile?.name?.trim()),
      Boolean(profile?.photo_data_url || profile?.photo_url),
      placeCount > 0,
      false,
      false,
      false,
    ];
    return checks.filter(Boolean).length;
  }, [profile, placeCount]);

  if (!hydrated) {
    return (
      <main className="mx-auto min-h-dvh max-w-md bg-white px-4 pb-28 pt-6">
        <DashboardSkeleton />
      </main>
    );
  }

  return (
    <main
      data-testid="account-view"
      className="mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6"
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 text-left"
        >
          <h1 className="text-[2.15rem] font-bold leading-[1.05] tracking-tight text-black">
            <span className="block">{firstName}</span>
            {lastName ? <span className="block">{lastName}</span> : null}
          </h1>
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="uber-press flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-2xl font-bold text-black"
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-sm font-semibold text-black">
          <Star className="h-3.5 w-3.5 fill-black text-black" aria-hidden />
          4.72
        </span>
        {profile?.phone ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-sm font-semibold text-black">
            <BadgeCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden />
            Verified
          </span>
        ) : (
          <span className="text-sm text-gray-500">Add phone to verify</span>
        )}
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
          {profile?.phone ? (
            <RiderPhotoField
              previewUrl={profile.photo_data_url}
              name={profile.name}
              phone={profile.phone}
              countryCode={profile.country_code || countryCode}
              onChange={() => refreshProfile()}
            />
          ) : null}
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

      <div className="mt-6 grid grid-cols-2 gap-3">
        <GridTile href="/help" label="Help" Icon={LifeBuoy} />
        <GridTile href="/account/payment" label="Wallet" Icon={Wallet} />
        <GridTile href="/help" label="Safety" Icon={Shield} />
        <GridTile href="/notifications" label="Inbox" Icon={Mail} />
      </div>

      <Link
        href="/account/payment"
        className="uber-press mt-4 flex overflow-hidden rounded-2xl bg-[#F5F5F5]"
      >
        <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
          <span className="text-base font-bold text-black">
            Try Village Pass free
          </span>
          <span className="mt-1 text-xs text-gray-500">
            Skip the booking fee · Ride, Delivery, Farm, Courier · cash or card
          </span>
        </span>
        <span className="relative h-[5.5rem] w-28 shrink-0">
          <Image
            src="/home/sug-ride.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="112px"
          />
        </span>
      </Link>

      <div className="mt-3">
        <SubscribeButton compact />
      </div>

      <Link
        href="/help"
        className="uber-press mt-3 flex items-center gap-3 rounded-2xl bg-[#F5F5F5] p-4"
      >
        <SafetyRing done={safetyDone} total={7} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-black">
            Safety check-up
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {safetyDone}/7 complete · add photo and saved places
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Link>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#F5F5F5] p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
          <Leaf className="h-5 w-5 text-emerald-600" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-black">
            Estimated CO₂ saved
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">0g</span>
        </span>
      </div>

      {profile?.phone ? (
        <div className="mt-3">
          <RiderReferralCard />
        </div>
      ) : null}

      <ul className="mt-6">
        <ListButton
          label="Settings"
          Icon={Settings}
          onClick={() => setEditing(true)}
        />
        <li>
          <button
            type="button"
            onClick={toggleSimple}
            className="uber-press flex min-h-14 w-full items-center gap-4 border-b border-gray-100 py-4 active:bg-gray-50"
          >
            <ALargeSmall className="h-5 w-5 shrink-0 text-black" aria-hidden />
            <span className="flex-1 text-left text-base font-medium text-black">
              Simple mode
            </span>
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
              NEW
            </span>
            <span className="text-sm font-semibold text-gray-500">
              {simple ? "On" : "Off"}
            </span>
          </button>
        </li>
        <ListRow href="/driver/join" label="Earn by driving" Icon={Car} />
        <ListRow href="/group" label="Saved groups" Icon={Users} />
        <ListRow
          href="/partners"
          label="Set up your business profile"
          Icon={Briefcase}
        />
        <ListRow
          href="/merchant/dashboard"
          label="Village Ride for Business"
          Icon={Briefcase}
        />
        <ListRow href="/shops" label="Shops promotions" Icon={Store} />
        <ListRow href="/account/places" label="Saved places" Icon={MapPin} />
        <ListRow href="/account/payment" label="Payment methods" Icon={Wallet} />
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

      <p className="mt-4 text-center text-xs text-gray-400">
        {country.flag} {country.name}
      </p>
    </main>
  );
}

function SafetyRing({ done, total }: { done: number; total: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / total);
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44" aria-hidden>
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="4"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#111"
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-black">
        {done}/{total}
      </span>
    </span>
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
      className="uber-press flex min-h-[5.25rem] flex-col justify-between rounded-2xl bg-[#F5F5F5] p-4 hover:bg-gray-200 active:bg-gray-300"
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

function ListButton({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: typeof Settings;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="uber-press flex min-h-14 w-full items-center gap-4 border-b border-gray-100 py-4 active:bg-gray-50"
      >
        <Icon className="h-5 w-5 shrink-0 text-black" aria-hidden />
        <span className="flex-1 text-left text-base font-medium text-black">
          {label}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
      </button>
    </li>
  );
}
