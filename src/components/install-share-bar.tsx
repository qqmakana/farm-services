"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";

const UBER_PATHS = new Set(["/", "/ride", "/delivery", "/farm"]);

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
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
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

async function shareAppLink() {
  const url =
    typeof window !== "undefined" ? window.location.origin : "https://village-ride.vercel.app";
  const text = `${BRAND.appName} by ${BRAND.company}\n${BRAND_TAGLINE}\nOpen & install from browser:\n${url}`;
  if (navigator.share) {
    await navigator.share({ title: BRAND.appName, text, url });
    return "shared";
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

/** Keeps the deferred install event so any Install button can trigger it. */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyInstallReady() {
  listeners.forEach((fn) => fn());
}

function useDeferredInstall() {
  const [, bump] = useState(0);
  useEffect(() => {
    const refresh = () => bump((n) => n + 1);
    listeners.add(refresh);
    const onBip = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt = e;
      notifyInstallReady();
    };
    const onInstalled = () => {
      deferredPrompt = null;
      notifyInstallReady();
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      listeners.delete(refresh);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return deferredPrompt;
}

export function useInstallActions() {
  const deferred = useDeferredInstall();
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        deferredPrompt = null;
        setStandalone(true);
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
    helpOpen,
    setHelpOpen,
    note,
    install,
    share,
  };
}

function HelpPanel({
  ios,
  onClose,
}: {
  ios: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold">
          Install {BRAND.appName}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          This is a browser app (not Play Store / App Store). Add it to your home screen:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
          {ios ? (
            <>
              <li>Tap the <strong>Share</strong> button in Safari</li>
              <li>Scroll and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong></li>
            </>
          ) : (
            <>
              <li>Open the browser menu (⋮ or ⋯)</li>
              <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
              <li>Confirm Install</li>
            </>
          )}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Tip: use Chrome or Edge on Android for the easiest Install button.
        </p>
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
  const { standalone, ios, helpOpen, setHelpOpen, note, install, share, deferred } =
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
        className="ml-1 rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-[var(--ru-brand)]"
      >
        {deferred ? "Install" : "Install"}
      </button>
      <button
        type="button"
        onClick={share}
        className="rounded-lg bg-white/15 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25"
      >
        Share
      </button>
      {note ? (
        <span className="absolute top-full right-4 mt-1 rounded bg-white px-2 py-1 text-[10px] font-medium text-slate-800 shadow">
          {note}
        </span>
      ) : null}
      {helpOpen ? <HelpPanel ios={ios} onClose={() => setHelpOpen(false)} /> : null}
    </>
  );
}

/** Bottom banner — always shown until installed (not hidable forever). */
export function InstallShareBar() {
  const pathname = usePathname();
  const { standalone, ios, helpOpen, setHelpOpen, note, install, share, deferred } =
    useInstallActions();
  const [minimized, setMinimized] = useState(false);

  // Uber map shell has its own Share/Install in the header — avoid covering the sheet
  if (UBER_PATHS.has(pathname)) {
    return null;
  }

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
          className="rounded-full bg-[var(--ru-brand)] px-4 py-2.5 text-sm font-bold text-white shadow-lg ring-2 ring-white"
        >
          Install app
        </button>
        <button
          type="button"
          onClick={share}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ru-brand)] shadow-lg"
        >
          Share
        </button>
        {helpOpen ? <HelpPanel ios={ios} onClose={() => setHelpOpen(false)} /> : null}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-lg rounded-2xl border-2 border-emerald-300/40 bg-[var(--ru-brand)] p-4 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">
              Install {BRAND.appName} on this phone
            </p>
            <p className="mt-1 text-sm text-white/80">
              Free home-screen app. Then tap Share to send the link to drivers &amp; customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            Minimize
          </button>
        </div>

        {ios ? (
          <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
            iPhone: Safari → <strong>Share</strong> → <strong>Add to Home Screen</strong>
          </p>
        ) : !deferred ? (
          <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
            Android: tap <strong>Install app</strong> below, or Chrome menu → Install app
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={install}
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--ru-brand)]"
          >
            Install app
          </button>
          <button
            type="button"
            onClick={share}
            className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold"
          >
            Share app
          </button>
        </div>
        {note ? <p className="mt-2 text-xs text-sky-200">{note}</p> : null}
      </div>
      {helpOpen ? <HelpPanel ios={ios} onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}

/** Hero CTAs for the home page. */
export function HomeInstallShareCtas() {
  const { standalone, ios, helpOpen, setHelpOpen, note, install, share } = useInstallActions();
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
        className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--ru-brand)] shadow"
      >
        Install app
      </button>
      <button
        type="button"
        onClick={share}
        className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
      >
        Share app
      </button>
      {note ? <p className="w-full text-sm text-sky-200">{note}</p> : null}
      {helpOpen ? <HelpPanel ios={ios} onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}
