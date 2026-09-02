"use client";

import {
  FETCH_SEND_SIZES,
  SIZE_VEHICLE,
  VEHICLE_LABELS,
  type ItemSize,
} from "@/lib/vehicles";
import { FETCH_SIZE_ICON } from "@/components/uber/item-visual";

export function ItemSizePicker({
  value,
  onChange,
  label = "What size?",
}: {
  value: ItemSize;
  onChange: (size: ItemSize) => void;
  label?: string;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold">{label}</p>
      <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label={label}>
        {FETCH_SEND_SIZES.map((s) => {
          const vehicle = SIZE_VEHICLE[s.id];
          const on = value === s.id;
          const Icon = FETCH_SIZE_ICON[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`uber-press min-h-14 rounded-2xl px-2 py-2 text-center ${
                on ? "bg-black text-white" : "bg-[#F3F3F3] text-black"
              }`}
            >
              <Icon
                className="mx-auto h-6 w-6"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="mt-1 block text-[13px] font-bold">{s.label}</span>
              <span
                className={`mt-0.5 block text-[10px] leading-tight ${
                  on ? "text-white/80" : "text-[#6B6B6B]"
                }`}
              >
                {s.hint}
              </span>
              <span
                className={`mt-0.5 block text-[10px] ${
                  on ? "text-white/70" : "text-[#8A8A8A]"
                }`}
              >
                {VEHICLE_LABELS[vehicle]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
