import { Suspense } from "react";
import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `How ${BRAND.appName} works`,
  description: "Request. Connect. Get it done — rides, delivery, courier, and farm transport.",
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
