"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  ArtConnect,
  ArtDone,
  ArtRequest,
  OnboardingSlide,
  type OnboardingSlideData,
} from "@/components/onboarding/onboarding-slide";

const SLIDES: OnboardingSlideData[] = [
  {
    id: "request",
    title: "Request what you need",
    description:
      "Ride, delivery, or farm transport — tap and tell us where to pick up and drop off.",
    art: <ArtRequest />,
  },
  {
    id: "connect",
    title: "We connect you",
    description:
      "A nearby driver in your area accepts — the same simple match you’d expect from Uber.",
    art: <ArtConnect />,
  },
  {
    id: "done",
    title: "Service done",
    description:
      "Your ride, package, or farm goods arrive. Pay in cash or card, then leave a rating.",
    art: <ArtDone />,
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const last = SLIDES.length - 1;

  useEffect(() => {
    if (hasSeenOnboarding()) router.replace("/");
  }, [router]);

  const finish = useCallback(() => {
    markOnboardingSeen();
    router.replace("/");
  }, [router]);

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
      <header className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-[var(--ru-brand)]">
          {BRAND.appName}
        </p>
        <button
          type="button"
          onClick={finish}
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
              : "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
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

      <footer className="space-y-5 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <OnboardingProgress count={SLIDES.length} index={index} onSelect={go} />
        <p className="sr-only" aria-live="polite">
          Step {index + 1} of {SLIDES.length}: {SLIDES[index].title}
        </p>
        <button
          type="button"
          onClick={() => {
            if (isLast) finish();
            else go(index + 1);
          }}
          className="ru-btn ru-btn-primary ru-btn-block !rounded-full text-base"
        >
          {isLast ? "Get started" : "Next"}
        </button>
      </footer>
    </div>
  );
}
