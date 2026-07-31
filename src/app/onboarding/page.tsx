import { Suspense } from "react";
import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `What makes ${BRAND.appName} special`,
  description:
    "When maps fail, describe a landmark. Say what you’re wearing. Get roadside fuel help.",
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
