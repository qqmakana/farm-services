"use client";

import { Suspense, useState } from "react";
import { DeliverySheet } from "@/components/uber/delivery-sheet";
import { UberShell } from "@/components/uber/uber-shell";

function DeliveryInner() {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  return (
    <UberShell pin={pin} backHref="/" title="Village Delivery">
      <DeliverySheet onPinChange={setPin} />
    </UberShell>
  );
}

export default function DeliveryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#1A4D3A]">
          Loading delivery…
        </div>
      }
    >
      <DeliveryInner />
    </Suspense>
  );
}
