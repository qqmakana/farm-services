"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  MapPinned,
  PlayCircle,
  User,
} from "lucide-react";
import { CountrySelector } from "@/components/country/country-selector";
import { useCountry } from "@/components/country/country-provider";
import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";
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

export function AccountView() {
  const router = useRouter();
  const { country, countryCode, locale } = useCountry();
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const p = getGuestProfile();
    setProfile(p);
    if (p) {
      setNameInput(p.name);
      setPhoneInput(p.phone);
    }
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
    setProfile(getGuestProfile());
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
      <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  const initial = (profile?.name || profile?.phone || "?").charAt(0).toUpperCase();
  const showForm = !profile?.phone || editing;
  const flag = country.flag;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold text-slate-900">Account</h1>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <CountrySelector />
      </div>

      {showForm ? (
        <form
          onSubmit={saveDetails}
          className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-600">
            Add your details so we can show your trips and keep in touch.
          </p>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 outline-none focus:border-[#1A4D3A]"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 outline-none focus:border-[#1A4D3A]"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={formatPhonePlaceholder(countryCode)}
              inputMode="tel"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#1A4D3A] py-3 text-sm font-bold text-white transition active:scale-95"
          >
            Save profile
          </button>
          {editing && profile?.phone ? (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="w-full py-2 text-sm text-slate-500 transition active:scale-95"
            >
              Cancel
            </button>
          ) : null}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition active:scale-95"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A4D3A] text-2xl font-bold text-white">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span aria-hidden>{flag}</span>
              {profile?.name || "Guest"}
            </span>
            <span className="mt-0.5 block text-sm text-slate-500">
              {profile?.phone} · {country.name}
            </span>
          </span>
          <User className="h-5 w-5 text-gray-400" aria-hidden />
        </button>
      )}

      <ul className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <li>
          <button
            type="button"
            onClick={() => {
              resetOnboardingForReplay();
              router.push("/onboarding?replay=1");
            }}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:scale-[0.99] active:bg-gray-50"
          >
            <span className="text-[#1A4D3A]">
              <PlayCircle className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-medium text-slate-900">
              How Village Ride works
            </span>
            <span className="text-xs text-slate-400">Replay</span>
            <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
          </button>
        </li>
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
        <li>
          <a
            href={BRAND_WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border-t border-gray-100 px-4 py-4 transition active:scale-[0.99] active:bg-gray-50"
          >
            <span className="text-[#1A4D3A]">
              <HelpCircle className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-medium text-slate-900">
              Help &amp; Support
            </span>
            <span className="text-xs text-slate-400">{BRAND.phone}</span>
            <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
          </a>
        </li>
      </ul>

      <p className="mt-6 text-center text-xs text-slate-400">
        {t("available_in", { locale, country: countryCode })}:{" "}
        {AVAILABLE_IN_FLAGS}
      </p>

      {profile?.phone ? (
        <button
          type="button"
          onClick={logout}
          className="mt-4 w-full py-3 text-center text-sm font-semibold text-rose-600 transition active:scale-95"
        >
          Log Out / Clear Profile
        </button>
      ) : null}
    </main>
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
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 border-t border-gray-100 px-4 py-4 first:border-t-0 transition active:scale-[0.99] active:bg-gray-50"
      >
        <span className="text-[#1A4D3A]">{icon}</span>
        <span className="flex-1 text-sm font-medium text-slate-900">
          {label}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
      </Link>
    </li>
  );
}
