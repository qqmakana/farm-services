"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  MapPinned,
  User,
} from "lucide-react";
import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";
import {
  clearGuestProfile,
  getGuestProfile,
  setGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";

export function AccountView() {
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
    setGuestProfile({ name: nameInput, phone: phoneInput });
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

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold text-slate-900">Account</h1>

      {showForm ? (
        <form
          onSubmit={saveDetails}
          className="mt-6 space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
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
              placeholder="063 621 3590"
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
          className="mt-6 flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition active:scale-95"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A4D3A] text-2xl font-bold text-white">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold text-slate-900">
              {profile?.name || "Guest"}
            </span>
            <span className="mt-0.5 block text-sm text-slate-500">
              {profile?.phone}
            </span>
          </span>
          <User className="h-5 w-5 text-gray-400" aria-hidden />
        </button>
      )}

      <ul className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <MenuRow
          href="/account/payment"
          icon={<CreditCard className="h-5 w-5" />}
          label="Payment Methods"
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

      {profile?.phone ? (
        <button
          type="button"
          onClick={logout}
          className="mt-8 w-full py-3 text-center text-sm font-semibold text-rose-600 transition active:scale-95"
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
