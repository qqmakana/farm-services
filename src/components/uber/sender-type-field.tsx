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
      <p className="text-sm font-semibold text-black">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`uber-press min-h-12 rounded-full px-3 text-center text-sm font-bold ${
              value === opt.id
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        Helps us know if you&apos;re a person or a local store — both welcome
        anywhere.
      </p>
    </div>
  );
}

export function senderTypeLabel(value: SenderType): string {
  return value === "business" ? "Local Business/Store" : "Individual";
}
