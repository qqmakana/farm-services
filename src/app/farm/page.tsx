"use client";

import { Suspense, useState } from "react";
import { FarmSheet } from "@/components/uber/farm-sheet";
import { UberShell } from "@/components/uber/uber-shell";

function FarmInner() {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  return (
    <UberShell pin={pin} backHref="/" title="Farm Connect">
      <FarmSheet onPinChange={setPin} />
    </UberShell>
  );
}

export default function FarmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5] text-[#000000]">
          Loading Farm Connect…
        </div>
      }
    >
      <FarmInner />
    </Suspense>
  );
}
