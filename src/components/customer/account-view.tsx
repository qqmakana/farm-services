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
import { formatPhoneDisplay } from "@/lib/format";
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
import {
  UBER_BTN_BLACK,
  UBER_GLOSS,
  UBER_INPUT,
  UBER_PAGE,
} from "@/components/customer/uber-chrome";

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
    if (!phoneInput.replace(/\D/g, "")) return;
    setGuestProfile({
      name: nameInput,
      phone: phoneInput.replace(/\D/g, ""),
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
  const avatarGlyph = profile?.name?.trim()
    ? (profile.name || "?").charAt(0).toUpperCase()
    : "?";
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
      <main className={UBER_PAGE}>
        <DashboardSkeleton />
      </main>
    );
  }

  return (
    <main
      data-testid="account-view"
      className={UBER_PAGE}
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 text-left"
        >
          <h1 className="text-[2.15rem] font-semibold leading-[1.05] tracking-tight text-[#0a0a0a]">
            <span className="block">{firstName}</span>
            {lastName ? <span className="block">{lastName}</span> : null}
          </h1>
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="uber-press flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e5e7eb] text-2xl font-medium text-[#0a0a0a]"
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
            avatarGlyph
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-sm font-medium text-[#0a0a0a] shadow-[0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
          <Star className="h-3.5 w-3.5 fill-[#0a0a0a] text-[#0a0a0a]" strokeWidth={2} aria-hidden />
          4.72
        </span>
        {profile?.phone ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-sm font-medium text-[#0a0a0a] shadow-[0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
            <BadgeCheck className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} aria-hidden />
            Verified
          </span>
        ) : (
          <span className="text-sm font-medium text-[#71717a]">Add phone to verify</span>
        )}
      </div>

      {showForm ? (
        <form onSubmit={saveDetails} className="mt-6 space-y-3">
          <input
            className={UBER_INPUT}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Name"
          />
          <input
            className={UBER_INPUT}
            value={phoneInput}
            onChange={(e) => setPhoneInput(formatPhoneDisplay(e.target.value))}
            placeholder={formatPhonePlaceholder(countryCode)}
            inputMode="tel"
            required
          />
          <CountrySelector compact showLanguage={false} />
          <button
            type="submit"
            className={UBER_BTN_BLACK}
          >
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
        <div className="mt-6">
          <RiderPhotoField
            previewUrl={profile.photo_data_url}
            name={profile.name}
            phone={profile.phone}
            countryCode={profile.country_code || countryCode}
            onChange={() => refreshProfile()}
          />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 vr-stagger">
        <GridTile href="/help" label="Help" Icon={LifeBuoy} />
        <GridTile href="/account/payment" label="Wallet" Icon={Wallet} />
        <GridTile href="/safety" label="Safety" Icon={Shield} />
        <GridTile href="/notifications" label="Inbox" Icon={Mail} />
      </div>

      <Link
        href="/account/payment"
        className={`uber-press mt-4 flex overflow-hidden rounded-[28px] ${UBER_GLOSS}`}
      >
        <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
          <span className="text-base font-semibold text-[#0a0a0a]">
            Try Village Pass free
          </span>
          <span className="mt-1 text-xs font-medium text-[#71717a]">
            Priority matching · Trip, Fetch, Send, Shops · cash or card
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
        href="/safety"
        className={`uber-press mt-4 flex items-center gap-3 rounded-[28px] p-4 ${UBER_GLOSS}`}
      >
        <SafetyRing done={safetyDone} total={7} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0a0a0a]">
            Safety check-up
          </span>
          <span className="mt-0.5 block text-xs font-medium text-[#71717a]">
            {safetyDone}/7 complete · add photo and saved places
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Link>

      <div className={`mt-4 flex items-center gap-3 rounded-[28px] p-4 ${UBER_GLOSS}`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
          <Leaf className="h-5 w-5 text-emerald-600" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0a0a0a]">
            Estimated CO₂ saved
          </span>
          <span className="mt-0.5 block text-xs font-medium text-[#71717a]">0g</span>
        </span>
      </div>

      {profile?.phone ? (
        <div className="mt-3">
          <RiderReferralCard />
        </div>
      ) : null}

      <ul className={`mt-6 overflow-hidden rounded-[28px] px-4 ${UBER_GLOSS}`}>
        <ListButton
          label="Settings"
          Icon={Settings}
          onClick={() => setEditing(true)}
        />
        <li>
          <button
            type="button"
            onClick={toggleSimple}
            className="uber-press flex min-h-14 w-full items-center gap-4 border-b border-[#ececec] py-4"
          >
            <ALargeSmall className="h-5 w-5 shrink-0 text-[#0a0a0a]" strokeWidth={2} aria-hidden />
            <span className="flex-1 text-left text-base font-medium text-[#0a0a0a]">
              Simple mode
            </span>
            <span className="rounded-full bg-blue-500 px-2 py-[1px] text-[10px] font-bold tracking-wide text-white">
              NEW
            </span>
            <span className="text-sm font-medium text-[#71717a]">
              {simple ? "On" : "Off"}
            </span>
          </button>
        </li>
        <ListRow href="/driver/join" label="Earn by driving" Icon={Car} testId="drive-signup-cta" />
        <ListRow
          href="/merchant/dashboard"
          label="I own a shop — kitchen & menu"
          Icon={Store}
          testId="shop-owner-cta"
        />
        <ListRow href="/account/delete" label="Delete account" Icon={Shield} />
        <ListRow href="/group" label="Saved groups" Icon={Users} />
        <ListRow
          href="/merchant/register"
          label="Register a shop"
          Icon={Briefcase}
        />
        <ListRow href="/shops" label="Browse shops" Icon={Store} />
        <ListRow href="/account/places" label="Saved places" Icon={MapPin} />
        <ListRow href="/account/payment" label="Payment methods" Icon={Wallet} />
        <ListRow href="/legal" label="Legal" Icon={Scale} />
        <ListRow href="/legal/cancellations" label="Cancellations" Icon={Scale} />
        <ListRow href="/status" label="Service status" Icon={LifeBuoy} />
        <ListRow href="/help" label="Support" Icon={LifeBuoy} />
      </ul>

      {profile?.phone ? (
        <button
          type="button"
          onClick={logout}
          className="uber-press mt-8 w-full py-3 text-center text-sm font-medium text-[#71717a]"
        >
          Sign out
        </button>
      ) : null}

      <p className="mt-4 text-center text-xs font-medium text-[#71717a]">
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
          stroke="#0a0a0a"
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-[#0a0a0a]">
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
      className={`uber-press flex min-h-[5.25rem] flex-col justify-between rounded-[28px] p-4 ${UBER_GLOSS}`}
    >
      <Icon className="h-5 w-5 text-[#0a0a0a]" strokeWidth={2} aria-hidden />
      <span className="text-sm font-semibold text-[#0a0a0a]">{label}</span>
    </Link>
  );
}

function ListRow({
  href,
  label,
  Icon,
  testId,
}: {
  href: string;
  label: string;
  Icon: typeof MapPin;
  testId?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        data-testid={testId}
        className="uber-press flex min-h-14 w-full items-center gap-4 border-b border-[#ececec] py-4 last:border-b-0"
      >
        <Icon className="h-5 w-5 shrink-0 text-[#0a0a0a]" strokeWidth={2} aria-hidden />
        <span className="flex-1 text-left text-base font-medium text-[#0a0a0a]">
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
        className="uber-press flex min-h-14 w-full items-center gap-4 border-b border-[#ececec] py-4"
      >
        <Icon className="h-5 w-5 shrink-0 text-[#0a0a0a]" strokeWidth={2} aria-hidden />
        <span className="flex-1 text-left text-base font-medium text-[#0a0a0a]">
          {label}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
      </button>
    </li>
  );
}
