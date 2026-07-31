/** Compress an optional pickup photo for job.details (works without Storage). */

export async function compressPickupPhotoDataUrl(
  file: File,
  maxBytes = 110_000,
): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (typeof createImageBitmap === "undefined") return null;

  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 900;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    let quality = 0.62;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > maxBytes && quality > 0.35) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > maxBytes) return null;
    return dataUrl;
  } catch {
    return null;
  }
}

export function pickupPhotoFromDetails(
  details: unknown,
): string | null {
  if (!details || typeof details !== "object") return null;
  const url = (details as Record<string, unknown>).pickup_photo_data_url;
  return typeof url === "string" && url.startsWith("data:image/") ? url : null;
}
