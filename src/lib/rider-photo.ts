/** Rider face photo helpers — profile + per-trip spotting (with wearing). */

import { fileToJpegDataUrl } from "@/lib/compress-image";

export async function compressRiderPhotoDataUrl(
  file: File,
): Promise<string | null> {
  return fileToJpegDataUrl(file, {
    maxSide: 720,
    maxBytes: 180_000,
    quality: 0.72,
    minQuality: 0.32,
  });
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

/** Storage path in rider-photos (not a displayable URL). */
export function riderPhotoStoragePathFromDetails(
  details: unknown,
  jobPath?: string | null,
): string | null {
  for (const raw of [jobPath, (details as { rider_photo_url?: unknown } | null)?.rider_photo_url]) {
    if (typeof raw !== "string") continue;
    const url = raw.trim();
    if (!url) continue;
    if (
      url.startsWith("data:") ||
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mock://")
    ) {
      continue;
    }
    return url;
  }
  return null;
}

export function wearingFromDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const w = (details as Record<string, unknown>).wearing;
  return typeof w === "string" && w.trim() ? w.trim() : null;
}
