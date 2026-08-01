/** Rider face photo helpers — profile + per-trip spotting (with wearing). */

import { compressPickupPhotoDataUrl } from "@/lib/pickup-photo";

export async function compressRiderPhotoDataUrl(
  file: File,
): Promise<string | null> {
  // Smaller than pickup spot — face recognition at arm's length.
  return compressPickupPhotoDataUrl(file, 90_000);
}

export function riderPhotoFromDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as Record<string, unknown>;
  const dataUrl = d.rider_photo_data_url;
  if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }
  const url = d.rider_photo_url;
  if (
    typeof url === "string" &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:image/"))
  ) {
    return url;
  }
  return null;
}

export function wearingFromDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const w = (details as Record<string, unknown>).wearing;
  return typeof w === "string" && w.trim() ? w.trim() : null;
}
