"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { shouldShowOnboarding } from "@/lib/onboarding";
import { DashboardSkeleton } from "@/components/ui/skeleton";

/**
 * Home first paint: send new users to /onboarding unless they
 * permanently dismissed or skipped for this session.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (shouldShowOnboarding()) {
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
