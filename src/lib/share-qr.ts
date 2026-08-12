import { BRAND, BRAND_ADDRESS_LINE, BRAND_SHARE_TEXT } from "@/lib/brand";
import { getAppInstallUrl, getSocialQrEntryUrl } from "@/lib/app-links";

/** Humble line when someone taps Share. */
export const SHARE_SCAN_TEXT = `${BRAND_SHARE_TEXT}

We're at ${BRAND_ADDRESS_LINE}. Scan the picture, or open the link.`;

export function socialQrImagePath(size = 512) {
  const target =
    typeof window !== "undefined"
      ? `${window.location.origin}/get-app?from=social`
      : getSocialQrEntryUrl();
  return `/api/qr?url=${encodeURIComponent(target)}&size=${size}`;
}

export async function shareVillageRideQr(): Promise<"shared" | "copied"> {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/get-app`
      : getAppInstallUrl();
  const text = SHARE_SCAN_TEXT;

  try {
    const res = await fetch(socialQrImagePath(640));
    if (res.ok) {
      const blob = await res.blob();
      const file = new File([blob], "village-ride-scan.png", {
        type: blob.type || "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: BRAND.appName,
          text,
          url,
          files: [file],
        });
        return "shared";
      }
    }
  } catch {
    /* fall through to text share */
  }

  if (navigator.share) {
    await navigator.share({ title: BRAND.appName, text, url });
    return "shared";
  }

  await navigator.clipboard.writeText(`${text}\n${url}`);
  return "copied";
}
