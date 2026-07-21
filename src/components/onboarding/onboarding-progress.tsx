"use client";

export function OnboardingProgress({
  count,
  index,
  onSelect,
}: {
  count: number;
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="tablist"
      aria-label="Onboarding progress"
    >
      {Array.from({ length: count }).map((_, i) => {
        const active = i === index;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Step ${i + 1} of ${count}`}
            onClick={() => onSelect(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              active
                ? "w-7 bg-[var(--ru-brand)]"
                : "w-2 bg-[#d1d1d1] hover:bg-[#b0b0b0]"
            }`}
          />
        );
      })}
    </div>
  );
}
