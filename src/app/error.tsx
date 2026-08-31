"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ContactSupportActions } from "@/components/support/contact-support";
import { BRAND } from "@/lib/brand";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="ru-force-light mx-auto flex min-h-dvh max-w-lg flex-col justify-center bg-white px-5 py-16 text-slate-900">
      <p className="text-sm font-medium text-[#111111]">
        {BRAND.appName}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[#111111]">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-[#666666]">
        We&apos;re fixing it. Try again, or contact support.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-black px-4 py-3.5 text-sm font-bold text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 px-4 py-3.5 text-center text-sm font-semibold text-black"
        >
          Back to home
        </Link>
        <p className="pt-2 text-xs font-semibold tracking-wide text-[#666666]">
          Contact support
        </p>
        <ContactSupportActions
          whatsappPrefill={`Hi ${BRAND.appName} support — I hit an error${
            error.digest ? ` (${error.digest})` : ""
          } and need help.`}
        />
      </div>
    </main>
  );
}
