/** Canonical public site URL — always https. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let url = "https://village-ride.vercel.app";
  if (fromEnv) {
    url = fromEnv.replace(/\/$/, "");
    if (url.startsWith("http://")) url = `https://${url.slice("http://".length)}`;
    if (!url.startsWith("https://")) url = `https://${url}`;
  }
  return url;
}

/** Full https link printed on pamphlets, posts, and share text. */
export function getAppInstallUrl(): string {
  return `${getSiteUrl()}/get-app`;
}

/** Pamphlet QR destination — opens install flow with light attribution. */
export function getPamphletEntryUrl(): string {
  return `${getAppInstallUrl()}?from=pamphlet`;
}

/** Social post QR — same install page, social attribution. */
export function getSocialQrEntryUrl(): string {
  return `${getAppInstallUrl()}?from=social`;
}

/** Driver signup from social QR posts. */
export function getDriverSocialQrUrl(): string {
  return `${getSiteUrl()}/driver/join?from=social`;
}

/** Short hostname for print (no https). */
export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return "village-ride.vercel.app";
  }
}
