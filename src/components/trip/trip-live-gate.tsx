"use client";

import { useEffect, useState } from "react";
import { LiveTrip } from "@/components/live-trip";
import { getJobByReference, getRatingForJob } from "@/lib/actions";
import type { JobWithDriver, Rating } from "@/lib/types";

/**
 * Loads the trip on the client so a missing/failed RSC fetch never shows
 * Next.js “error occurred in the Server Components render”.
 */
export function TripLiveGate({ code }: { code: string }) {
  const [job, setJob] = useState<JobWithDriver | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const load = async () => {
      try {
        const next = await getJobByReference(code);
        if (cancelled) return;
        if (!next) {
          if (tries < 10) {
            tries += 1;
            window.setTimeout(load, 400);
            return;
          }
          setErr("We could not open this trip. Check Activity, or book again.");
          return;
        }
        const r = await getRatingForJob(next.id).catch(() => null);
        if (cancelled) return;
        setJob(next);
        setRating(r);
      } catch (e) {
        if (cancelled) return;
        if (tries < 10) {
          tries += 1;
          window.setTimeout(load, 400);
          return;
        }
        setErr(e instanceof Error ? e.message : "Could not load this trip.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (err) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center text-black">
        <p className="text-[22px] font-bold">Trip did not open</p>
        <p className="mt-2 text-[15px] text-[#6B6B6B]">{err}</p>
        <a
          href="/"
          className="mt-6 flex min-h-12 w-full max-w-sm items-center justify-center rounded-full bg-black text-[15px] font-semibold text-white"
        >
          Back to home
        </a>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center text-black">
        <p className="text-[22px] font-bold">Finding your driver...</p>
        <p className="mt-2 text-[15px] text-[#6B6B6B]">
          Offering to the best-matched online driver
        </p>
      </main>
    );
  }

  return <LiveTrip initialJob={job} initialRating={rating} />;
}
