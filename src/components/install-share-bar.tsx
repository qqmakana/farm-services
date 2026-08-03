"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import {
  getAppInstallUrl,
  getDeferredPrompt,
  isIosDevice,
  isStandaloneDisplay,
  promptNativeInstall,
  subscribeInstallReady,
} from "@/lib/pwa-install";

const HIDE_BANNER = new Set([
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
  "/get-app",
]);

async function shareAppLink() {
  const url =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://village-ride.vercel.app";
  const text = `${BRAND.appName} — open in Chrome/Safari, then Install / Add to Home Screen:\n${url}`;
  if (navigator.share) {
    await navigator.share({ title: `${BRAND.appName} app`, text, url });
    return "shared";
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

function useDeferredInstall() {
  const [, bump] = useState(0);
  useEffect(() => subscribeInstallReady(() => bump((n) => n + 1)), []);
  return getDeferredPrompt();
}

export function useInstallActions() {
  const deferred = useDeferredInstall();
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());
    const onInstalled = () => setStandalone(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const install = useCallback(async () => {
    // Prefer the native browser PWA prompt (Chrome/Edge/Android).
    // Never force an APK download from in-app Install buttons — that causes
    // "format not supported" when the file is missing or blocked.
    if (deferred || getDeferredPrompt()) {
      setInstalling(true);
      try {
        const outcome = await promptNativeInstall();
        if (outcome === "accepted") {
          setStandalone(true);
          setNote("Installed — check your home screen");
        } else if (outcome === "unavailable") {
          setHelpOpen(true);
        }
      } finally {
        setInstalling(false);
      }
      return;
    }

    // iOS Safari never fires beforeinstallprompt — show Share instructions.
    if (isIosDevice()) {
      setHelpOpen(true);
      return;
    }

    // Android / desktop without a deferred prompt: guide to browser menu.
    setHelpOpen(true);
  }, [deferred]);

  const share = useCallback(async () => {
    try {
      const result = await shareAppLink();
      if (result === "copied") {
        setNote("Link copied — paste to WhatsApp");
        setTimeout(() => setNote(null), 3000);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setNote(`Copy: ${getAppInstallUrl()}`);
    }
  }, []);

  return {
    deferred,
    standalone,
    ios,
    helpOpen,
    setHelpOpen,
    note,
    installing,
    install,
    share,
  };
}

export function InstallHelpPanel({
  ios,
  onClose,
}: {
  ios: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold">
          Install {BRAND.appName}
        </p>
        {ios ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              To install, tap the Share button and select &quot;Add to Home
              Screen.&quot;
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
              <li>
                Tap <strong>Share</strong> (square with ↑) in Safari
              </li>
              <li>
                Tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong>
              </li>
            </ol>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Use your browser&apos;s Install option — that&apos;s the reliable
              way to add Village Ride to your home screen.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
              <li>
                Tap the <strong>⋮</strong> menu in Chrome
              </li>
              <li>
                Tap <strong>Install app</strong> or{" "}
                <strong>Add to Home screen</strong>
              </li>
              <li>
                Tap <strong>Install</strong>
              </li>
            </ol>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-[var(--ru-brand)] py-3 text-sm font-bold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/** Always-visible Install + Share in the top nav. */
export function NavInstallShare() {
  const { standalone, ios, helpOpen, setHelpOpen, note, installing, install, share } =
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
        <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} />
      ) : null}
    </>
  );
}

/** Bottom banner — shown until installed or dismissed. */
export function InstallShareBar() {
  const pathname = usePathname();
  const { standalone, ios, helpOpen, setHelpOpen, note, installing, install, share, deferred } =
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

  if (
    HIDE_BANNER.has(pathname) ||
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
          className="ru-btn ru-btn-primary !min-h-10 shadow-lg !text-sm"
        >
          Install app
        </button>
        {helpOpen ? (
          <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 p-3 sm:p-4">
      <div className="mx-auto flex w-full items-center gap-3 rounded-2xl border border-[var(--ru-line)] bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:bg-[#1e1e1e]">
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
            {deferred ? "Add to your home screen" : "One tap to install"}
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
      {helpOpen ? <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}

/** Hero CTAs for the home page. */
export function HomeInstallShareCtas() {
  const { standalone, ios, helpOpen, setHelpOpen, note, installing, install, share } =
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
      {helpOpen ? <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}
