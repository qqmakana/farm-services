"use client";

import { Suspense, useState } from "react";
import { CourierSheet } from "@/components/uber/courier-sheet";
import { UberShell } from "@/components/uber/uber-shell";

function CourierInner() {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  return (
    <UberShell pin={pin} backHref="/" title="Courier">
      <CourierSheet onPinChange={setPin} />
    </UberShell>
  );
}

export default function CourierPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#1A4D3A]">
          Loading courier…
        </div>
      }
    >
      <CourierInner />
    </Suspense>
  );
}
