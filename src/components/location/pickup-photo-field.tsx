"use client";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
};

/** Optional pickup-spot photo — needs data; description alone is enough. */
export function PickupPhotoField({ file, onChange }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-[#fafafa] px-3 py-3">
      <p className="text-sm font-semibold text-black">
        Photo of pickup spot{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Uses mobile data — skip this if signal is weak. A clear description is
        enough.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">
          {file ? "Change photo" : "Take photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          Upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {file ? (
          <button
            type="button"
            className="text-xs font-semibold text-slate-600 underline"
            onClick={() => onChange(null)}
          >
            Remove
          </button>
        ) : null}
        {file ? (
          <span className="truncate text-xs text-slate-500">{file.name}</span>
        ) : null}
      </div>
    </div>
  );
}
