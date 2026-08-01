"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2, User } from "lucide-react";
import {
  deleteRiderPhoto,
  uploadRiderPhoto,
} from "@/lib/actions";
import {
  clearGuestRiderPhoto,
  getGuestProfile,
  setGuestRiderPhoto,
} from "@/lib/guest-profile";
import { compressRiderPhotoDataUrl } from "@/lib/rider-photo";

type Props = {
  /** Shown preview (data URL preferred). */
  previewUrl?: string | null;
  name?: string;
  phone?: string;
  countryCode?: string;
  onChange?: (preview: string | null) => void;
  /** Compact = booking sheet; default = account. */
  compact?: boolean;
};

/**
 * Optional rider face photo — camera or gallery.
 * Saves compressed data URL locally; uploads to rider-photos when possible.
 */
export function RiderPhotoField({
  previewUrl,
  name = "",
  phone = "",
  countryCode = "ZA",
  onChange,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function applyPreview(url: string | null) {
    setPreview(url);
    onChange?.(url);
  }

  function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const dataUrl = await compressRiderPhotoDataUrl(file);
        if (!dataUrl) {
          setError("Could not read that photo. Try another JPEG or PNG.");
          return;
        }

        let storagePath: string | null = null;
        const guest = getGuestProfile();
        const usePhone = phone.trim() || guest?.phone || "";
        if (usePhone) {
          const fd = new FormData();
          fd.set("phone", usePhone);
          fd.set("name", name.trim() || guest?.name || "");
          fd.set("country_code", countryCode);
          fd.set("photo", file);
          try {
            const res = await uploadRiderPhoto(fd);
            storagePath = res.photo_url;
          } catch {
            // Local data URL still works for booking / mock.
          }
        }

        setGuestRiderPhoto({
          photo_data_url: dataUrl,
          photo_url: storagePath,
        });
        applyPreview(dataUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const guest = getGuestProfile();
      const usePhone = phone.trim() || guest?.phone || "";
      if (usePhone) {
        try {
          await deleteRiderPhoto(usePhone);
        } catch {
          /* ignore */
        }
      }
      clearGuestRiderPhoto();
      applyPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-3"
          : "rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      }
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Your photo"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-black/10"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f0f0] text-slate-400 ring-2 ring-black/5">
              <User className="h-8 w-8" aria-hidden />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-black">
            Your photo{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Your photo is only shared with your driver.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition active:scale-95">
              <Camera className="h-3.5 w-3.5" aria-hidden />
              {pending ? "Saving…" : preview ? "Change" : "Add photo"}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="sr-only"
                disabled={pending}
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {preview ? (
              <button
                type="button"
                disabled={pending}
                onClick={remove}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
