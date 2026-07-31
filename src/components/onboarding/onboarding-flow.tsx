"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/brand";
import {
  hasPermanentlyDismissedOnboarding,
  markOnboardingSeen,
  skipOnboardingForSession,
} from "@/lib/onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  OnboardingSlide,
  type OnboardingSlideData,
} from "@/components/onboarding/onboarding-slide";
import {
  ArtDescribePlace,
  ArtFuelHelp,
  ArtShopLocal,
  ArtWearing,
} from "@/components/onboarding/feature-tour-art";

/** Unique Village Ride features — show, don’t tell. */
const SLIDES: OnboardingSlideData[] = [
  {
    id: "describe",
    title: "Describe your place",
    description:
      "No street address needed. Just describe where you are — “green gate, next to the mango tree.”",
    art: <ArtDescribePlace />,
  },
  {
    id: "wearing",
    title: "Say what you’re wearing",
    description:
      "Tell your driver — “Nike tracksuit”, “red jacket” — so they spot you faster at the landmark.",
    art: <ArtWearing />,
  },
  {
    id: "shops",
    title: "Buy from local shops",
    description:
      "Order groceries and essentials from spaza shops in your village — delivered to your place.",
    art: <ArtShopLocal />,
  },
  {
    id: "fuel",
    title: "Fuel delivered to you",
    description:
      "Stuck on the road? Request fuel from nearby drivers — pay them in cash when it arrives.",
    art: <ArtFuelHelp />,
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReplay = searchParams.get("replay") === "1";
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const last = SLIDES.length - 1;

  useEffect(() => {
    // Never bounce replay visits home — even if permanent flag is set.
    if (isReplay) return;
    if (hasPermanentlyDismissedOnboarding()) {
      router.replace("/");
    }
  }, [router, isReplay]);

  const goHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  const finishPermanent = useCallback(() => {
    markOnboardingSeen();
    goHome();
  }, [goHome]);

  const skipForNow = useCallback(() => {
    skipOnboardingForSession();
    goHome();
  }, [goHome]);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(last, next)));
      setDragX(0);
    },
    [last],
  );

  function onPointerDown(clientX: number) {
    startX.current = clientX;
    setDragging(true);
  }

  function onPointerMove(clientX: number) {
    if (!dragging) return;
    setDragX(clientX - startX.current);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    const threshold = 56;
    if (dragX < -threshold && index < last) go(index + 1);
    else if (dragX > threshold && index > 0) go(index - 1);
    else setDragX(0);
  }

  const isLast = index === last;

  return (
    <div className="relative flex min-h-dvh flex-col bg-white text-black">
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-[var(--ru-brand)]">
          {BRAND.appName}
        </p>
        <button
          type="button"
          onClick={skipForNow}
          className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--ru-muted)] transition hover:bg-[#f5f5f5] hover:text-black"
        >
          Skip
        </button>
      </header>

      <div
        className="relative min-h-0 flex-1 touch-pan-y overflow-hidden select-none"
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
        onTouchEnd={onPointerUp}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => {
          if (e.buttons === 1) onPointerMove(e.clientX);
        }}
        onMouseUp={onPointerUp}
        onMouseLeave={() => {
          if (dragging) onPointerUp();
        }}
      >
        <div
          className="flex h-full will-change-transform"
          style={{
            width: `${SLIDES.length * 100}%`,
            transform: `translate3d(calc(-${(index * 100) / SLIDES.length}% + ${dragX}px), 0, 0)`,
            transition: dragging
              ? "none"
              : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              className="h-full shrink-0"
              style={{ width: `${100 / SLIDES.length}%` }}
            >
              <OnboardingSlide slide={slide} active={i === index} />
            </div>
          ))}
        </div>
      </div>

      <footer className="space-y-3 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <OnboardingProgress count={SLIDES.length} index={index} onSelect={go} />
        <p className="sr-only" aria-live="polite">
          Step {index + 1} of {SLIDES.length}: {SLIDES[index].title}
        </p>
        <button
          type="button"
          onClick={() => {
            if (isLast) finishPermanent();
            else go(index + 1);
          }}
          className="ru-btn ru-btn-primary ru-btn-block !rounded-full text-base"
        >
          {isLast ? "Get started" : "Next"}
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={finishPermanent}
            className="ru-btn ru-btn-ghost ru-btn-block !min-h-11 text-sm"
          >
            Don&apos;t show again
          </button>
        ) : (
          <p className="text-center text-xs text-[var(--ru-muted)]">
            Swipe or tap Next — replay anytime in Account
          </p>
        )}
      </footer>
    </div>
  );
}
