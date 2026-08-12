/** Canonical public site URL (pamphlets, QR codes, share links). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
  return "https://village-ride.vercel.app";
}

/** PWA install screen — best target for pamphlet QR codes. */
export function getAppInstallUrl(): string {
  return `${getSiteUrl()}/get-app`;
}

/** Pamphlet QR destination — opens install flow with light attribution. */
export function getPamphletEntryUrl(): string {
  return `${getAppInstallUrl()}?from=pamphlet`;
}

/** Short hostname for print (no https). */
export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return "village-ride.vercel.app";
  }
}
