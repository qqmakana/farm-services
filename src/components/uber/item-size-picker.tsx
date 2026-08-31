"use client";

import {
  FETCH_SEND_SIZES,
  SIZE_VEHICLE,
  VEHICLE_EMOJI,
  type ItemSize,
} from "@/lib/vehicles";

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
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`uber-press min-h-14 rounded-2xl px-2 py-2 text-center ${
                on ? "bg-black text-white" : "bg-[#F3F3F3] text-black"
              }`}
            >
              <span className="block text-[16px]">{VEHICLE_EMOJI[vehicle]}</span>
              <span className="block text-[13px] font-bold">{s.label}</span>
              <span
                className={`mt-0.5 block text-[10px] leading-tight ${
                  on ? "text-white/80" : "text-[#6B6B6B]"
                }`}
              >
                {s.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
