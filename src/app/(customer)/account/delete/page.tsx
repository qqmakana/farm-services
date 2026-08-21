"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UBER_BTN_BLACK, UBER_H1, UBER_PAGE, UBER_SUB } from "@/components/customer/uber-chrome";
import {
  clearGuestProfile,
  getGuestProfile,
  type GuestProfile,
} from "@/lib/guest-profile";
import { BRAND } from "@/lib/brand";

export default function DeleteAccountPage() {
  const [done, setDone] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [profile, setProfile] = useState<GuestProfile | null>(null);

  useEffect(() => {
    setProfile(getGuestProfile());
  }, []);

  function removeLocal() {
    clearGuestProfile();
    setProfile(null);
    setDone(true);
  }

  return (
    <main className={UBER_PAGE}>
      <h1 className={UBER_H1}>Delete your account</h1>
      <p className={UBER_SUB}>
        This removes Village Ride data stored on this phone. To delete trip
        records on our servers, email {BRAND.email} from the phone number on
        your account.
      </p>

      {done ? (
        <p className="mt-8 text-[15px] font-semibold text-[#0a0a0a]">
          Data on this phone has been deleted. You can close the app.
        </p>
      ) : confirming ? (
        <div className="mt-8 space-y-3">
          <p className="text-[15px] font-medium text-[#0a0a0a]">
            Delete data for {profile?.phone || "this phone"}? This cannot be
            undone on the device.
          </p>
          <button type="button" className={UBER_BTN_BLACK} onClick={removeLocal}>
            Yes, delete
          </button>
          <button
            type="button"
            className="uber-press uber-btn-soft w-full"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${UBER_BTN_BLACK} mt-8`}
          onClick={() => setConfirming(true)}
        >
          Delete account on this phone
        </button>
      )}

      <a
        href={`mailto:${BRAND.email}?subject=Delete%20my%20Village%20Ride%20account`}
        className="mt-4 block text-center text-sm font-semibold text-[#6b6b6b] underline"
      >
        Email us to delete server records
      </a>
      <Link
        href="/account"
        className="mt-6 block text-center text-sm font-semibold text-[#0a0a0a]"
      >
        Back to Account
      </Link>
    </main>
  );
}
