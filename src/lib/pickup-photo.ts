import { fileToJpegDataUrl } from "@/lib/compress-image";

/** Compress an optional pickup photo for job.details (works without Storage). */
export async function compressPickupPhotoDataUrl(
  file: File,
  maxBytes = 180_000,
): Promise<string | null> {
  return fileToJpegDataUrl(file, {
    maxSide: 900,
    maxBytes,
    quality: 0.68,
    minQuality: 0.32,
  });
}

export function pickupPhotoFromDetails(
  details: unknown,
): string | null {
  if (!details || typeof details !== "object") return null;
  const url = (details as Record<string, unknown>).pickup_photo_data_url;
  return typeof url === "string" && url.startsWith("data:image/") ? url : null;
}
