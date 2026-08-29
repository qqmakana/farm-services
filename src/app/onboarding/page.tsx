import { Suspense } from "react";
import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `What makes ${BRAND.appName} special`,
  description:
    "Trip, Trip + stop, Fetch, Send and Shops. You stay in the car for a shop or clinic stop. We start operating at the end of September.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white text-sm text-[var(--ru-muted)]">
          Loading…
        </div>
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}
