"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { ShareQrSheet } from "@/components/share-qr-sheet";
import { SHARE_IMAGE_PATH, shareVillageRideImage } from "@/lib/share-qr";
import {
  getAppInstallUrl,
  getDeferredPrompt,
  getPlayStoreUrl,
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplay,
  promptNativeInstall,
  subscribeInstallReady,
} from "@/lib/pwa-install";

const HIDE_BANNER = new Set([
  "/services",
  "/activity",
  "/account",
  "/driver/home",
  "/driver/jobs",
  "/driver/earnings",
  "/driver/account",
  "/get-app",
]);

async function shareAppLink() {
  return shareVillageRideImage();
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
  const [shareOpen, setShareOpen] = useState(false);
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
    if (isAndroidDevice()) {
      window.location.href = getPlayStoreUrl();
      return;
    }

    // iOS Safari never fires beforeinstallprompt — show Share instructions.
    if (isIosDevice()) {
      setHelpOpen(true);
      return;
    }

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

    window.location.href = getAppInstallUrl();
  }, [deferred]);

  const share = useCallback(async () => {
    setShareOpen(true);
  }, []);

  const sendSquare = useCallback(async () => {
    try {
      const result = await shareAppLink();
      setShareOpen(false);
      if (result === "copied") {
        setNote("Copied — paste to WhatsApp");
        setTimeout(() => setNote(null), 3000);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setShareOpen(false);
        return;
      }
      setNote(`Copy: ${getAppInstallUrl()}`);
    }
  }, []);

  return {
    deferred,
    standalone,
    ios,
    helpOpen,
    setHelpOpen,
    shareOpen,
    setShareOpen,
    note,
    installing,
    install,
    share,
    sendSquare,
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
              Use Chrome&apos;s Install option — that adds Village Ride to your
              home screen like a real app.
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
            <a
              href={getAppInstallUrl()}
              className="mt-4 block w-full rounded-xl bg-black py-3 text-center text-sm font-bold text-white"
            >
              Open install page
            </a>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-black"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/** Always-visible Install + Share in the top nav. */
export function NavInstallShare() {
  const {
    standalone,
    ios,
    helpOpen,
    setHelpOpen,
    shareOpen,
    setShareOpen,
    note,
    installing,
    install,
    share,
    sendSquare,
  } = useInstallActions();

  if (standalone) {
    return (
      <>
        <button
          type="button"
          onClick={share}
          className="ml-1 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white"
        >
          Share
        </button>
        {shareOpen ? (
          <ShareQrSheet onClose={() => setShareOpen(false)} onShare={sendSquare} />
        ) : null}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        disabled={installing}
        className="ml-1 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white disabled:opacity-70"
      >
        {installing ? "…" : "Install"}
      </button>
      {note ? (
        <span className="absolute top-full right-0 z-[70] mt-1 max-w-[240px] rounded bg-black px-2 py-1 text-[10px] font-medium text-white shadow">
          {note}
        </span>
      ) : null}
      {helpOpen ? (
        <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} />
      ) : null}
      {shareOpen ? (
        <ShareQrSheet onClose={() => setShareOpen(false)} onShare={sendSquare} />
      ) : null}
    </>
  );
}

/** Bottom banner — sits above the Home/Activity/Account tab bar. */
export function InstallShareBar() {
  const pathname = usePathname();
  const {
    standalone,
    ios,
    helpOpen,
    setHelpOpen,
    shareOpen,
    setShareOpen,
    note,
    installing,
    install,
    share,
    sendSquare,
    deferred,
  } = useInstallActions();
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
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  if (dismissed) return null;

  // Clearance for customer tab bar (4rem) + home indicator safe area
  const aboveTabs =
    "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)";

  if (standalone) {
    return (
      <div
        className="fixed right-3 z-[70]"
        style={{ bottom: aboveTabs }}
      >
        <button
          type="button"
          onClick={share}
          className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          Share
        </button>
        {shareOpen ? (
          <ShareQrSheet onClose={() => setShareOpen(false)} onShare={sendSquare} />
        ) : null}
      </div>
    );
  }

  if (minimized) {
    return (
      <div
        className="fixed right-3 z-[70] flex flex-col items-end gap-2"
        style={{ bottom: aboveTabs }}
      >
        <button
          type="button"
          onClick={install}
          disabled={installing}
          className="uber-press rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-70"
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
    <div
      className="fixed left-1/2 z-[70] w-full max-w-md -translate-x-1/2 px-3"
      style={{ bottom: aboveTabs }}
      data-testid="install-share-bar"
    >
      <div className="mx-auto flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.16)]">
        <button
          type="button"
          onClick={share}
          className="shrink-0 rounded-xl bg-white ring-1 ring-gray-200"
          aria-label="Preview share picture"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SHARE_IMAGE_PATH}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-cover"
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-black">
            Keep {BRAND.appName} handy
          </p>
          <p className="text-xs text-gray-500">
            {deferred ? "Add to your home screen" : "Tap Install or share the app"}
          </p>
        </div>
        <button
          type="button"
          onClick={install}
          disabled={installing}
          className="uber-press shrink-0 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-70"
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
          className="shrink-0 px-1 text-lg text-gray-400"
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
      {shareOpen ? (
        <ShareQrSheet onClose={() => setShareOpen(false)} onShare={sendSquare} />
      ) : null}
    </div>
  );
}

/** Hero CTAs for the home page. */
export function HomeInstallShareCtas() {
  const {
    standalone,
    ios,
    helpOpen,
    setHelpOpen,
    shareOpen,
    setShareOpen,
    note,
    installing,
    install,
    share,
    sendSquare,
  } = useInstallActions();
  if (standalone) {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={share} className="ru-btn ru-btn-primary">
          Share this app
        </button>
        {shareOpen ? (
          <ShareQrSheet onClose={() => setShareOpen(false)} onShare={sendSquare} />
        ) : null}
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
        Share
      </button>
      {note ? <p className="w-full text-sm text-sky-200">{note}</p> : null}
      {helpOpen ? <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} /> : null}
      {shareOpen ? (
        <ShareQrSheet onClose={() => setShareOpen(false)} onShare={sendSquare} />
      ) : null}
    </div>
  );
}
