"use client";

export type SenderType = "individual" | "business";

const OPTIONS: { id: SenderType; label: string }[] = [
  { id: "individual", label: "Individual" },
  { id: "business", label: "Local Business / Store" },
];

export function SenderTypeField({
  value,
  onChange,
  label = "Sender type",
}: {
  value: SenderType;
  onChange: (value: SenderType) => void;
  label?: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#1A4D3A]">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${
              value === opt.id
                ? "border-[#1A4D3A] bg-[#E8F5E9] text-[#1A4D3A]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        Helps us know if you&apos;re a person or a local store — both welcome
        anywhere.
      </p>
    </div>
  );
}

export function senderTypeLabel(value: SenderType): string {
  return value === "business" ? "Local Business/Store" : "Individual";
}
