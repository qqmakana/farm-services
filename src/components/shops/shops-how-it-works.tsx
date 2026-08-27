"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArtShopArrive,
  ArtShopChoose,
  ArtShopDriver,
  ArtShopTill,
} from "@/components/shops/shops-how-art";

const SLIDES = [
  {
    id: "choose",
    kicker: "Step 1",
    title: "Two ways to shop",
    description:
      "Know the shop? Send a shopping list. Or browse menus nearby and tap what you want.",
    art: <ArtShopChoose />,
  },
  {
    id: "driver",
    kicker: "Step 2",
    title: "A driver goes for you",
    description:
      "They buy or collect the items and bring them to your gate or landmark.",
    art: <ArtShopDriver />,
  },
  {
    id: "till",
    kicker: "Step 3",
    title: "You pay for the goods",
    description:
      "Groceries and meals are paid at the shop. Village Ride only charges the delivery fee.",
    art: <ArtShopTill />,
  },
  {
    id: "arrive",
    kicker: "Step 4",
    title: "Cash or card for delivery",
    description:
      "Pay the driver in cash, or pay the fee with PayPal. Track it like a trip.",
    art: <ArtShopArrive />,
  },
] as const;

const AUTO_MS = 5200;

export function ShopsHowItWorks() {
  const last = SLIDES.length - 1;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(last, next)));
      setDragX(0);
    },
    [last],
  );

  useEffect(() => {
    if (paused || dragging) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i >= last ? 0 : i + 1));
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, dragging, last]);

  function onPointerDown(clientX: number) {
    startX.current = clientX;
    setDragging(true);
    setPaused(true);
  }

  function onPointerMove(clientX: number) {
    if (!dragging) return;
    setDragX(clientX - startX.current);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    const threshold = 48;
    if (dragX < -threshold && index < last) go(index + 1);
    else if (dragX > threshold && index > 0) go(index - 1);
    else setDragX(0);
  }

  const slide = SLIDES[index];

  return (
    <section
      data-testid="shops-how-it-works"
      className="overflow-hidden rounded-[28px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.03]"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-[13px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
          How it works
        </p>
        <p className="text-[13px] font-medium text-[#A6A6A6]">
          {index + 1} / {SLIDES.length}
        </p>
      </div>

      <div
        className="relative touch-pan-y select-none overflow-hidden"
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
          className="flex will-change-transform"
          style={{
            width: `${SLIDES.length * 100}%`,
            transform: `translate3d(calc(-${(index * 100) / SLIDES.length}% + ${dragX}px), 0, 0)`,
            transition: dragging
              ? "none"
              : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {SLIDES.map((s) => (
            <div
              key={s.id}
              className="shrink-0 px-5 pt-3"
              style={{ width: `${100 / SLIDES.length}%` }}
            >
              {s.art}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-[12px] font-semibold tracking-wide text-[#0ECB81] uppercase">
          {slide.kicker}
        </p>
        <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.3px] text-black">
          {slide.title}
        </h2>
        <p className="mt-1.5 min-h-[3.2rem] text-[15px] leading-relaxed text-[#6B6B6B]">
          {slide.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="How Shops works"
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${s.title}, step ${i + 1}`}
                onClick={() => {
                  setPaused(true);
                  go(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-7 bg-black" : "w-2 bg-[#D2D2D2]"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            data-testid="shops-how-next"
            onClick={() => {
              setPaused(true);
              go(index >= last ? 0 : index + 1);
            }}
            className="uber-press rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white"
          >
            {index >= last ? "Start over" : "Next"}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {slide.title}. {slide.description}
        </p>
      </div>
    </section>
  );
}
