"use client";

const EXAMPLES = [
  "House with green gate, next to the mango tree",
  "Blue house after the church",
  "Sipho's shop, opposite the clinic",
  "Clinic gate, ask for Nomsa",
];

export function DescribePlaceExamples({
  onPick,
}: {
  onPick: (text: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        Describe your place — examples
      </p>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onPick(ex)}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-left text-[11px] font-medium text-slate-700 transition hover:border-black hover:text-black active:scale-95"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
