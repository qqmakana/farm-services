import { BRAND, BRAND_SHARE_TEXT } from "@/lib/brand";
import { getAppInstallUrl } from "@/lib/app-links";

export const SHARE_IMAGE_PATH = "/village-ride-share.png";

export async function shareVillageRideImage(): Promise<"shared" | "copied"> {
  const url = getAppInstallUrl();
  const text = BRAND_SHARE_TEXT;

  try {
    const res = await fetch(SHARE_IMAGE_PATH);
    if (res.ok) {
      const blob = await res.blob();
      const file = new File([blob], "village-ride-share.png", {
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
