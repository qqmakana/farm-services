"use client";

import { useEffect, useState } from "react";

type Props = {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  accept?: string;
};

/** File input with live preview (JPEG/PNG, max 5MB enforced server-side). */
export function PhotoUploadField({
  name,
  label,
  required,
  hint,
  accept = "image/jpeg,image/png",
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <label className="block text-xs font-medium text-slate-700">
      {label}
      {required ? " *" : ""}
      {hint ? (
        <span className="mt-0.5 block font-normal text-[var(--ru-muted)]">
          {hint}
        </span>
      ) : null}
      <input
        required={required}
        name={name}
        type="file"
        accept={accept}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (preview) URL.revokeObjectURL(preview);
          if (!file) {
            setPreview(null);
            return;
          }
          setPreview(URL.createObjectURL(file));
        }}
      />
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
