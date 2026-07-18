"use client";

import { Suspense, useState } from "react";
import { RideSheet } from "@/components/uber/ride-sheet";
import { UberShell } from "@/components/uber/uber-shell";

function RideInner() {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  return (
    <UberShell pin={pin} backHref="/" title="Village Ride">
      <RideSheet onPinChange={setPin} />
    </UberShell>
  );
}

export default function RidePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#1A4D3A]">
          Loading ride…
        </div>
      }
    >
      <RideInner />
    </Suspense>
  );
}
