"use client";

import Link from "next/link";
import { ContactSupportActions } from "@/components/support/contact-support";
import { BRAND } from "@/lib/brand";

export default function RideErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <main className="ru-force-light mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-white px-5 py-16 text-black">
      <p className="text-xs font-semibold tracking-wide text-[#6B6B6B] uppercase">
        {BRAND.appName}
      </p>
      <h1 className="mt-2 text-2xl font-bold">Trip booking did not open</h1>
      <p className="mt-2 text-sm text-[#6B6B6B]">
        Try again after the page loads, or go back home and tap Where to?
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-black px-4 py-3.5 text-sm font-bold text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-[#EEEEEE] px-4 py-3.5 text-center text-sm font-semibold text-black"
        >
          Back to home
        </Link>
        <ContactSupportActions
          whatsappPrefill={`Hi ${BRAND.appName} support — Trip won't load on my phone.`}
        />
      </div>
    </main>
  );
}
