"use client";

import {
  WEIGHT_CATEGORIES,
  type WeightCategory,
} from "@/lib/pricing";

export function WeightCategoryField({
  value,
  onChange,
  serviceLabel = "item",
}: {
  value: WeightCategory;
  onChange: (v: WeightCategory) => void;
  serviceLabel?: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--ru-ink)]">
        Select weight category
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        Estimate your {serviceLabel} — no scale needed. Heavier loads pay
        drivers more.
      </p>
      <div className="mt-2 space-y-2">
        {WEIGHT_CATEGORIES.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={`weight-${opt.id}`}
              onClick={() => onChange(opt.id)}
              className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                selected
                  ? "border-2 border-[var(--ru-ink)] bg-white"
                  : "border border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold text-[var(--ru-ink)]">
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {opt.hint}
                </span>
              </span>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected
                    ? "border-[var(--ru-ink)] bg-[var(--ru-ink)]"
                    : "border-gray-300"
                }`}
                aria-hidden
              >
                {selected ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
