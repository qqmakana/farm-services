/**
 * Client-side JPEG compress for uploads (driver docs, etc.).
 * Keeps Server Action payloads under Next.js body limits.
 */

export type CompressImageOptions = {
  /** Longest edge in px (default 1400 — fine for ID/vehicle checks). */
  maxSide?: number;
  /** Soft target size in bytes (default ~420KB). */
  maxBytes?: number;
  /** Starting JPEG quality 0–1. */
  quality?: number;
};

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, body] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const base = filename.replace(/\.[^.]+$/, "") || "photo";
  return new File([bytes], `${base}.jpg`, { type: mime });
}

/**
 * Resize + JPEG-compress a photo File for upload.
 * Returns the original file if compression is unavailable or not helpful.
 */
export async function compressImageFile(
  file: File,
  opts: CompressImageOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|heic|webp)$/i.test(file.name)) {
    return file;
  }
  if (typeof createImageBitmap === "undefined") return file;

  const maxSide = opts.maxSide ?? 1400;
  const maxBytes = opts.maxBytes ?? 420_000;
  let quality = opts.quality ?? 0.72;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length * 0.75 > maxBytes && quality > 0.4) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    const out = dataUrlToFile(dataUrl, file.name);
    // Prefer compressed only when it actually helps (or original was huge)
    if (out.size < file.size || file.size > maxBytes) return out;
    return file;
  } catch {
    return file;
  }
}

/** Replace the chosen file on an `<input type="file">` with a compressed File. */
export function setInputFile(input: HTMLInputElement, file: File) {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}
