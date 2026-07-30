/** Shared PWA install helpers — keep prompt capture at module load. */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function captureInstallPrompt(e: BeforeInstallPromptEvent) {
  e.preventDefault();
  deferredPrompt = e;
  notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", captureInstallPrompt);
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
  notify();
}

export function subscribeInstallReady(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function isIosDevice() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isAndroidDevice() {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** WhatsApp / Instagram / Facebook / etc. — no native install prompt. */
export function isInAppBrowser() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|BytedanceWebview|Snapchat|WhatsApp|MicroMessenger|Pinterest|LinkedInApp|GSA\//i.test(
    ua,
  );
}

export function getAppInstallPath() {
  return "/get-app";
}

export function getAppInstallUrl() {
  if (typeof window === "undefined") return "https://village-ride.vercel.app/get-app";
  return `${window.location.origin}/get-app`;
}

/** Open the install page in Chrome (Android). One tap from WhatsApp. */
export function openInstallInChrome() {
  const url = getAppInstallUrl();
  if (!isAndroidDevice()) {
    window.location.href = url;
    return;
  }
  const target = new URL(url);
  window.location.href = `intent://${target.host}${target.pathname}${target.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
}

export async function promptNativeInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  const deferred = deferredPrompt;
  if (!deferred) return "unavailable";
  try {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      deferredPrompt = null;
      notify();
    }
    return outcome;
  } catch {
    return "unavailable";
  }
}
