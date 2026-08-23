/**
 * Client-side JPEG compress for uploads (driver docs, rider face, pickup).
 * Keeps Server Action payloads under Next.js body limits.
 *
 * Phone cameras often send empty MIME, HEIC, or 4–12MB JPEGs. We decode with
 * createImageBitmap, then fall back to HTMLImageElement so those still work.
 */

export type CompressImageOptions = {
  /** Longest edge in px (default 1400 — fine for ID/vehicle checks). */
  maxSide?: number;
  /** Soft target size in bytes (default ~420KB). */
  maxBytes?: number;
  /** Starting JPEG quality 0–1. */
  quality?: number;
  /** Stop lowering quality below this (default 0.4). */
  minQuality?: number;
};

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif|bmp|avif)$/i;

export function looksLikeImageFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/")) return true;
  if (IMAGE_EXT.test(file.name)) return true;
  // Android/iOS camera often sends an empty type and no extension.
  return !type && file.size > 0;
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, body] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const base = filename.replace(/\.[^.]+$/, "") || "photo";
  return new File([bytes], `${base}.jpg`, { type: mime });
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode photo"));
    };
    img.src = url;
  });
}

type DecodedImage = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  close: () => void;
};

async function decodeImageFile(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
        close: () => bitmap.close(),
      };
    } catch {
      // HEIC / odd camera MIME — try the <img> path.
    }
  }
  const img = await loadHtmlImage(file);
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    close: () => {},
  };
}

/**
 * Decode any camera/gallery image to a JPEG data URL.
 * Returns the best result we got — never discards a successful decode for size.
 */
export async function fileToJpegDataUrl(
  file: File,
  opts: CompressImageOptions = {},
): Promise<string | null> {
  if (!looksLikeImageFile(file)) return null;

  const maxSide = opts.maxSide ?? 1400;
  const maxBytes = opts.maxBytes ?? 420_000;
  const minQuality = opts.minQuality ?? 0.35;
  let quality = opts.quality ?? 0.72;

  try {
    const decoded = await decodeImageFile(file);
    if (!decoded.width || !decoded.height) {
      decoded.close();
      return null;
    }
    const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
    const w = Math.max(1, Math.round(decoded.width * scale));
    const h = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      decoded.close();
      return null;
    }
    decoded.draw(ctx, w, h);
    decoded.close();

    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length * 0.75 > maxBytes && quality > minQuality) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    return dataUrl;
  } catch {
    return null;
  }
}

/**
 * Resize + JPEG-compress a photo File for upload.
 * Returns the original file if compression is unavailable or not helpful.
 */
export async function compressImageFile(
  file: File,
  opts: CompressImageOptions = {},
): Promise<File> {
  const dataUrl = await fileToJpegDataUrl(file, opts);
  if (!dataUrl) return file;
  const out = dataUrlToFile(dataUrl, file.name);
  const maxBytes = opts.maxBytes ?? 420_000;
  if (out.size < file.size || file.size > maxBytes) return out;
  return file;
}

/** Replace the chosen file on an `<input type="file">` with a compressed File. */
export function setInputFile(input: HTMLInputElement, file: File) {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}
