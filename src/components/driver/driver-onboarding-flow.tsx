"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import {
  markDriverOnboardingSeen,
  skipDriverOnboardingForSession,
} from "@/lib/driver-onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

const SLIDES = [
  {
    id: "accept",
    title: "How to accept trips",
    body: "Go Online on Home. When a request appears, tap ACCEPT within the timer — or DECLINE so the next driver gets it.",
  },
  {
    id: "find",
    title: "How to find riders",
    body: "Use the pickup description (and photo if they added one). Open Maps when there’s a pin. Call the rider if you can’t find them — GPS is optional.",
  },
  {
    id: "paid",
    title: "How to get paid",
    body: "Customer pays you cash. You keep ~85%. Keep your commission wallet topped up so you stay eligible for new offers.",
  },
  {
    id: "bonus",
    title: "Weekly trip bonus",
    body: "Complete 10 trips this week and earn a R100 wallet bonus. Track progress on the Earnings tab.",
  },
] as const;

export function DriverOnboardingFlow() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const last = SLIDES.length - 1;
  const isLast = index === last;

  const finish = useCallback(() => {
    markDriverOnboardingSeen();
    router.replace("/driver/home");
  }, [router]);

  const skip = useCallback(() => {
    skipDriverOnboardingForSession();
    router.replace("/driver/home");
  }, [router]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-white text-black">
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <p className="text-sm font-bold tracking-tight">{BRAND.appName} Driver</p>
        <button
          type="button"
          onClick={skip}
          className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500"
        >
          Skip
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center px-6 pb-4">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Step {index + 1} of {SLIDES.length}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-bold tracking-tight">
          {SLIDES[index].title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {SLIDES[index].body}
        </p>
      </div>

      <footer className="space-y-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <OnboardingProgress
          count={SLIDES.length}
          index={index}
          onSelect={setIndex}
        />
        <button
          type="button"
          onClick={() => {
            if (isLast) finish();
            else setIndex((i) => Math.min(last, i + 1));
          }}
          className="ru-btn ru-btn-primary ru-btn-block !rounded-full"
        >
          {isLast ? "Start driving" : "Next"}
        </button>
      </footer>
    </div>
  );
}
