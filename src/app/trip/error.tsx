"use client";

import { BRAND } from "@/lib/brand";

export default function TripErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="ru-force-light mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-white px-5 py-16 text-black">
      <p className="text-xs font-semibold tracking-wide text-[#6B6B6B] uppercase">
        {BRAND.appName}
      </p>
      <h1 className="mt-2 text-2xl font-bold">Your trip is still here</h1>
      <p className="mt-2 text-sm text-[#6B6B6B]">
        The map did not open this time. Try again, or open Activity.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-black px-4 py-3.5 text-sm font-bold text-white"
        >
          Try again
        </button>
        <a
          href="/activity"
          className="rounded-full border border-[#EEEEEE] px-4 py-3.5 text-center text-sm font-semibold text-black"
        >
          Open Activity
        </a>
        <a
          href="/"
          className="rounded-full bg-[#F3F3F3] px-4 py-3.5 text-center text-sm font-semibold text-black"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
