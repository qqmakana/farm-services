"use client";

import { useEffect, useState } from "react";
import { compressImageFile, setInputFile } from "@/lib/compress-image";

type Props = {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  accept?: string;
};

/** File input with live preview; compresses before submit (JPEG, ~420KB). */
export function PhotoUploadField({
  name,
  label,
  required,
  hint,
  accept = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/*",
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <label className="block text-xs font-semibold text-slate-800">
      {label}
      {required ? " *" : ""}
      {hint ? (
        <span className="mt-0.5 block font-normal text-slate-600">
          {hint}
        </span>
      ) : null}
      <input
        required={required}
        name={name}
        type="file"
        accept={accept}
        disabled={busy}
        className="mt-1 block w-full text-sm text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#000000] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:opacity-60"
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          setLocalError(null);
          if (preview) URL.revokeObjectURL(preview);
          if (!file) {
            setPreview(null);
            return;
          }
          if (file.size > 12 * 1024 * 1024) {
            setLocalError("Photo is too large (max 12MB before compress).");
            input.value = "";
            setPreview(null);
            return;
          }
          setBusy(true);
          try {
            const compressed = await compressImageFile(file, {
              maxSide: 1400,
              maxBytes: 420_000,
            });
            if (compressed.size > 5 * 1024 * 1024) {
              setLocalError("Could not shrink photo under 5MB. Try another photo.");
              input.value = "";
              setPreview(null);
              return;
            }
            setInputFile(input, compressed);
            setPreview(URL.createObjectURL(compressed));
          } catch {
            setLocalError("Could not process photo. Try JPEG or PNG.");
            input.value = "";
            setPreview(null);
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy ? (
        <span className="mt-1 block text-[11px] font-normal text-slate-500">
          Optimizing photo…
        </span>
      ) : null}
      {localError ? (
        <span className="mt-1 block text-[11px] font-medium text-rose-700">
          {localError}
        </span>
      ) : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mt-2 h-28 w-full rounded-xl object-cover ring-1 ring-[var(--ru-line)]"
        />
      ) : null}
    </label>
  );
}
