"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { hasSeenOnboarding } from "@/lib/onboarding";
import { DashboardSkeleton } from "@/components/ui/skeleton";

/**
 * First visit to home → /onboarding.
 * Returning users see children immediately after a localStorage check.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasSeenOnboarding()) {
      router.replace("/onboarding");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <DashboardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
