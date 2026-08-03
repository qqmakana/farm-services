"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  CreditCard,
  HelpCircle,
  MapPinned,
  PlayCircle,
  User,
} from "lucide-react";
import { CountrySelector } from "@/components/country/country-selector";
import { useCountry } from "@/components/country/country-provider";
import { AVAILABLE_IN_FLAGS } from "@/lib/countries";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import {
  clearGuestProfile,
  getGuestProfile,
  setGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";
import { resetOnboardingForReplay } from "@/lib/onboarding";
import { t } from "@/lib/i18n";
import { RiderPhotoField } from "@/components/rider/rider-photo-field";
import { RiderReferralCard } from "@/components/referral/rider-referral-card";
import { SubscribeButton } from "@/components/subscription/subscribe-button";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export function AccountView() {
  const router = useRouter();
  const { country, countryCode, locale } = useCountry();
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
      <PageShell title="Account">
        <DashboardSkeleton />
      </PageShell>
    );
  }

  const initial = (profile?.name || profile?.phone || "?").charAt(0).toUpperCase();
  const showForm = !profile?.phone || editing;
  const flag = country.flag;

  return (
    <PageShell title="Account" subtitle="Profile, places, and support">
      <div className="ru-card p-5">
        <CountrySelector />
      </div>

      {showForm ? (
        <form onSubmit={saveDetails} className="ru-card mt-4 space-y-3 p-5">
          <p className="text-sm text-[var(--ru-muted)]">
            Add your details so we can show your trips and keep in touch.
          </p>
          <label className="block text-sm font-semibold text-black">
            Name
            <input
              className="ru-soft-field mt-1"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
            />
          </label>
          <label className="block text-sm font-semibold text-black">
            Phone
            <input
              className="ru-soft-field mt-1"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={formatPhonePlaceholder(countryCode)}
              inputMode="tel"
              required
            />
          </label>
          <button type="submit" className="ru-btn ru-btn-primary ru-btn-block">
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
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ru-card ru-row mt-4 w-full !border-0"
        >
          {profile?.photo_data_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_data_url}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <span className="ru-icon-circle !h-14 !w-14 text-xl font-bold">
              {initial}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-lg font-bold text-black">
              <span aria-hidden>{flag}</span>
              {profile?.name || "Guest"}
            </span>
            <span className="mt-0.5 block text-sm text-[var(--ru-muted)]">
              {profile?.phone} · {country.name}
            </span>
          </span>
          <User className="h-5 w-5 text-[var(--ru-muted)]" aria-hidden />
        </button>
      )}

      {profile?.phone ? (
        <div className="mt-4">
          <RiderPhotoField
            previewUrl={profile.photo_data_url}
            name={profile.name}
            phone={profile.phone}
            countryCode={profile.country_code || countryCode}
            onChange={() => refreshProfile()}
          />
        </div>
      ) : null}

      {profile?.phone ? <RiderReferralCard /> : null}

      <div className="mt-4">
        <SubscribeButton />
      </div>

      <div className="ru-list mt-6">
        <button
          type="button"
          onClick={() => {
            resetOnboardingForReplay();
            router.push("/onboarding?replay=1");
          }}
          className="ru-row w-full"
        >
          <span className="text-black">
            <PlayCircle className="h-5 w-5" />
          </span>
          <span className="flex-1 text-sm font-semibold text-black">
            See features again
          </span>
          <span className="ru-chip">Tour</span>
          <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
        </button>
        <MenuRow
          href="/notifications"
          icon={<Bell className="h-5 w-5" />}
          label="Notifications"
        />
        <MenuRow
          href="/account/payment"
          icon={<CreditCard className="h-5 w-5" />}
          label={t("payment_methods", { locale, country: countryCode })}
        />
        <MenuRow
          href="/account/places"
          icon={<MapPinned className="h-5 w-5" />}
          label="Saved Places"
        />
        <Link href="/help" className="ru-row w-full">
          <span className="text-black">
            <HelpCircle className="h-5 w-5" />
          </span>
          <span className="flex-1 text-sm font-semibold text-black">
            Help &amp; Support
          </span>
          <span className="text-xs text-[var(--ru-muted)]">WhatsApp · Email</span>
          <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--ru-muted)]">
        {t("available_in", { locale, country: countryCode })}:{" "}
        {AVAILABLE_IN_FLAGS}
      </p>

      {profile?.phone ? (
        <button
          type="button"
          onClick={logout}
          className="ru-btn ru-btn-ghost ru-btn-block mt-2 !text-[var(--ru-error)]"
        >
          Log Out / Clear Profile
        </button>
      ) : null}
    </PageShell>
  );
}

function MenuRow({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className="ru-row w-full">
      <span className="text-black">{icon}</span>
      <span className="flex-1 text-sm font-semibold text-black">{label}</span>
      <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
    </Link>
  );
}
