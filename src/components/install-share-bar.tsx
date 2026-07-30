"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";

const UBER_PATHS = new Set([
  "/",
  "/services",
  "/activity",
  "/account",
  "/ride",
  "/delivery",
  "/farm",
  "/courier",
  "/driver/home",
  "/driver/jobs",
  "/driver/earnings",
  "/driver/account",
]);

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

/** Capture install prompt ASAP — it can fire before React mounts. */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyInstallReady() {
  listeners.forEach((fn) => fn());
}

function captureInstallPrompt(e: BeforeInstallPromptEvent) {
  e.preventDefault();
  deferredPrompt = e;
  notifyInstallReady();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", captureInstallPrompt);
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyInstallReady();
  });
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** WhatsApp / Instagram / Facebook / etc. — no native install prompt. */
function isInAppBrowser() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|BytedanceWebview|Snapchat|WhatsApp|MicroMessenger|Pinterest|LinkedInApp|GSA\//i.test(
    ua,
  );
}

function inAppBrowserName() {
  const ua = navigator.userAgent || "";
  if (/WhatsApp/i.test(ua)) return "WhatsApp";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/TikTok|BytedanceWebview/i.test(ua)) return "TikTok";
  return "this app";
}

async function shareAppLink() {
  const url =
    typeof window !== "undefined" ? window.location.origin : "https://village-ride.vercel.app";
  const text = `${BRAND.appName} by ${BRAND.company}
${BRAND_TAGLINE}

${url}

To INSTALL on Android:
1) Tap the link
2) Tap ⋮ → Open in Chrome
3) Tap Install app

(Install does not work inside WhatsApp — only in Chrome.)`;
  if (navigator.share) {
    // Prefer text+url so WhatsApp shows the steps; some apps ignore `text` if only `url` is set.
    await navigator.share({ title: BRAND.appName, text, url });
    return "shared";
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

function openInSystemBrowser() {
  const url = window.location.href;
  if (/Android/i.test(navigator.userAgent)) {
    const { host, pathname, search, hash } = window.location;
    window.location.href = `intent://${host}${pathname}${search}${hash}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
    return;
  }
  void navigator.clipboard.writeText(url).catch(() => undefined);
}

function useDeferredInstall() {
  const [, bump] = useState(0);
  useEffect(() => {
    const refresh = () => bump((n) => n + 1);
    listeners.add(refresh);
    // Sync if prompt already arrived before this hook mounted
    if (deferredPrompt) refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);
  return deferredPrompt;
}

export function useInstallActions() {
  const deferred = useDeferredInstall();
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());
    setInApp(isInAppBrowser());
  }, []);

  const install = useCallback(async () => {
    if (isInAppBrowser()) {
      setInApp(true);
      setHelpOpen(true);
      setNote(`Open in Chrome or Safari — Install does not work inside ${inAppBrowserName()}`);
      setTimeout(() => setNote(null), 5000);
      return;
    }

    if (deferred) {
      setInstalling(true);
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") {
          deferredPrompt = null;
          setStandalone(true);
          setNote("Installed — check your home screen");
        } else {
          setNote("Install cancelled — tap Install again when ready");
          setTimeout(() => setNote(null), 4000);
        }
      } catch {
        setHelpOpen(true);
        setNote("Install popup blocked — follow the steps below");
      } finally {
        setInstalling(false);
      }
      return;
    }

    setHelpOpen(true);
  }, [deferred]);

  const share = useCallback(async () => {
    try {
      const result = await shareAppLink();
      if (result === "copied") {
        setNote("Link copied — paste to WhatsApp / Facebook");
        setTimeout(() => setNote(null), 3000);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setNote("Copy this link: https://village-ride.vercel.app");
    }
  }, []);

  return {
    deferred,
    standalone,
    ios,
    inApp,
    helpOpen,
    setHelpOpen,
    note,
    installing,
    install,
    share,
  };
}

function HelpPanel({
  ios,
  inApp,
  onClose,
}: {
  ios: boolean;
  inApp: boolean;
  onClose: () => void;
}) {
  const appName = inApp ? inAppBrowserName() : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold">
          Install {BRAND.appName}
        </p>

        {inApp ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              You opened the link inside <strong>{appName}</strong>. Install only works in{" "}
              <strong>Chrome</strong> or <strong>Safari</strong> — not inside another app.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
              {ios ? (
                <>
                  <li>
                    Tap <strong>⋯</strong> or <strong>Share</strong> in {appName}
                  </li>
                  <li>
                    Choose <strong>Open in Safari</strong> (or Chrome)
                  </li>
                  <li>
                    In Safari: Share → <strong>Add to Home Screen</strong>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Tap the menu <strong>⋮</strong> in {appName}
                  </li>
                  <li>
                    Choose <strong>Open in Chrome</strong> (or browser)
                  </li>
                  <li>
                    In Chrome tap <strong>Install app</strong>
                  </li>
                </>
              )}
            </ol>
            {!ios ? (
              <button
                type="button"
                onClick={() => {
                  openInSystemBrowser();
                }}
                className="mt-4 w-full rounded-xl bg-[var(--ru-brand)] py-3 text-sm font-bold text-white"
              >
                Open in Chrome
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                }}
                className="mt-4 w-full rounded-xl bg-[var(--ru-brand)] py-3 text-sm font-bold text-white"
              >
                Copy link — open in Safari
              </button>
            )}
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              This is a browser app (not Play Store / App Store). Add it to your home screen:
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
              {ios ? (
                <>
                  <li>
                    Tap the <strong>Share</strong> button in Safari
                  </li>
                  <li>
                    Scroll and tap <strong>Add to Home Screen</strong>
                  </li>
                  <li>
                    Tap <strong>Add</strong>
                  </li>
                </>
              ) : (
                <>
                  <li>Open the browser menu (⋮ or ⋯)</li>
                  <li>
                    Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
                  </li>
                  <li>Confirm Install</li>
                </>
              )}
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Tip: use Chrome or Edge on Android for the one-tap Install button.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-xl py-3 text-sm font-bold ${
            inApp
              ? "mt-2 border border-slate-200 bg-white text-slate-800"
              : "mt-4 bg-[var(--ru-brand)] text-white"
          }`}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/** Always-visible Install + Share in the top nav. */
export function NavInstallShare() {
  const { standalone, ios, inApp, helpOpen, setHelpOpen, note, installing, install, share } =
    useInstallActions();

  if (standalone) {
    return (
      <button
        type="button"
        onClick={share}
        className="ml-1 rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-[var(--ru-brand)]"
      >
        Share
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        disabled={installing}
        className="ml-1 rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-[var(--ru-brand)] disabled:opacity-70"
      >
        {installing ? "…" : "Install"}
      </button>
      <button
        type="button"
        onClick={share}
        className="rounded-lg bg-white/15 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25"
      >
        Share
      </button>
      {note ? (
        <span className="absolute top-full right-4 z-[70] mt-1 max-w-[240px] rounded bg-white px-2 py-1 text-[10px] font-medium text-slate-800 shadow">
          {note}
        </span>
      ) : null}
      {helpOpen ? (
        <HelpPanel ios={ios} inApp={inApp} onClose={() => setHelpOpen(false)} />
      ) : null}
    </>
  );
}

/** Bottom banner — shown until installed or dismissed. */
export function InstallShareBar() {
  const pathname = usePathname();
  const { standalone, ios, inApp, helpOpen, setHelpOpen, note, installing, install, share, deferred } =
    useInstallActions();
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem("vr_install_banner_dismissed") === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  // Customer shell / Uber map — avoid covering the bottom tab bar or sheet
  if (
    UBER_PATHS.has(pathname) ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  if (dismissed) return null;

  if (standalone) {
    return (
      <div className="fixed right-3 bottom-3 z-50">
        <button
          type="button"
          onClick={share}
          className="rounded-full bg-[var(--ru-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          Share app
        </button>
      </div>
    );
  }

  if (minimized) {
    return (
      <div className="fixed right-3 bottom-3 z-50 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={install}
          disabled={installing}
          className="rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-70"
        >
          Install app
        </button>
        {helpOpen ? (
          <HelpPanel ios={ios} inApp={inApp} onClose={() => setHelpOpen(false)} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-[var(--ru-line)] bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:bg-[#1e1e1e]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-black dark:text-white">
            Install {BRAND.appName}
          </p>
          <p className="text-xs text-[var(--ru-muted)]">
            {inApp
              ? "Open in Chrome / Safari to install"
              : ios
                ? "Add to Home Screen for the app feel"
                : deferred
                  ? "Add to your home screen"
                  : "Install for faster access"}
          </p>
        </div>
        <button
          type="button"
          onClick={install}
          disabled={installing}
          className="ru-btn ru-btn-brand !min-h-10 shrink-0 !px-4 !text-sm disabled:opacity-70"
        >
          {installing ? "…" : "Install"}
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            setMinimized(true);
            try {
              localStorage.setItem("vr_install_banner_dismissed", "1");
              setDismissed(true);
            } catch {
              /* ignore */
            }
          }}
          className="shrink-0 px-1 text-lg text-[var(--ru-muted)]"
        >
          ×
        </button>
      </div>
      {note ? (
        <p className="mx-auto mt-2 max-w-lg rounded-lg bg-black/80 px-3 py-2 text-center text-xs text-white">
          {note}
        </p>
      ) : null}
      {helpOpen ? (
        <HelpPanel ios={ios} inApp={inApp} onClose={() => setHelpOpen(false)} />
      ) : null}
    </div>
  );
}

/** Hero CTAs for the home page. */
export function HomeInstallShareCtas() {
  const { standalone, ios, inApp, helpOpen, setHelpOpen, note, installing, install, share } =
    useInstallActions();
  if (standalone) {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={share} className="ru-btn ru-btn-primary">
          Share this app
        </button>
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={install}
        disabled={installing}
        className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--ru-brand)] shadow disabled:opacity-70"
      >
        {installing ? "Installing…" : "Install app"}
      </button>
      <button
        type="button"
        onClick={share}
        className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
      >
        Share app
      </button>
      {note ? <p className="w-full text-sm text-sky-200">{note}</p> : null}
      {helpOpen ? (
        <HelpPanel ios={ios} inApp={inApp} onClose={() => setHelpOpen(false)} />
      ) : null}
    </div>
  );
}
