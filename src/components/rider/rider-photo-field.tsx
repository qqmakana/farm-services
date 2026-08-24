"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, ImagePlus, Trash2, User } from "lucide-react";
import {
  deleteRiderPhoto,
  uploadRiderPhoto,
} from "@/lib/actions";
import {
  clearGuestRiderPhoto,
  getGuestProfile,
  setGuestProfile,
  setGuestRiderPhoto,
} from "@/lib/guest-profile";
import { dataUrlToFile } from "@/lib/compress-image";
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

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,image/*";

/**
 * Optional rider face photo — gallery upload first, camera optional.
 * Saves a compressed JPEG locally; uploads that same file when a phone exists.
 */
export function RiderPhotoField({
  previewUrl,
  name = "",
  phone = "",
  countryCode = "ZA",
  onChange,
  compact = false,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (previewUrl !== undefined) setPreview(previewUrl ?? null);
  }, [previewUrl]);

  function applyPreview(url: string | null) {
    setPreview(url);
    onChange?.(url);
  }

  function resetInputs() {
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function ensureGuest(usePhone: string) {
    if (getGuestProfile()?.phone) return;
    setGuestProfile({
      name: name.trim() || "Guest",
      phone: usePhone,
      country_code: countryCode,
    });
  }

  function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    setHint(null);
    startTransition(async () => {
      try {
        const dataUrl = await compressRiderPhotoDataUrl(file);
        if (!dataUrl) {
          setError(
            "Could not read that photo. Choose a JPEG or PNG, or take a new photo.",
          );
          resetInputs();
          return;
        }

        const guest = getGuestProfile();
        const usePhone = phone.trim() || guest?.phone || "";
        applyPreview(dataUrl);

        if (!usePhone) {
          setHint("Add your phone number so we can keep this photo.");
          return;
        }

        ensureGuest(usePhone);
        setGuestRiderPhoto({
          photo_data_url: dataUrl,
          photo_url: guest?.photo_url ?? null,
        });

        const jpeg = dataUrlToFile(dataUrl, file.name || "face.jpg");
        const fd = new FormData();
        fd.set("phone", usePhone);
        fd.set("name", name.trim() || guest?.name || "");
        fd.set("country_code", countryCode);
        fd.set("photo", jpeg);
        try {
          const res = await uploadRiderPhoto(fd);
          setGuestRiderPhoto({
            photo_data_url: dataUrl,
            photo_url: res.photo_url,
          });
        } catch {
          setHint("Saved on this phone. Driver will still see it on this trip.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save that photo.");
      } finally {
        resetInputs();
      }
    });
  }

  function remove() {
    setError(null);
    setHint(null);
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
      resetInputs();
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
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              {pending ? "Saving…" : preview ? "Change" : "Add photo"}
              <input
                ref={galleryRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                disabled={pending}
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition active:scale-95">
              <Camera className="h-3.5 w-3.5" aria-hidden />
              Camera
              <input
                ref={cameraRef}
                type="file"
                accept={ACCEPT}
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
      ) : hint ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
