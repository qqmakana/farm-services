"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  getAppInstallUrl,
  getDeferredPrompt,
  inAppBrowserName,
  isAndroidDevice,
  isInAppBrowser,
  isIosDevice,
  isStandaloneDisplay,
  openInstallInChrome,
  promptNativeInstall,
  subscribeInstallReady,
} from "@/lib/pwa-install";

/**
 * One-tap install — PWA Add to Home Screen (no APK required).
 * Works for Chrome/Android, Safari/iOS, and WhatsApp in-app browsers.
 */
export function EasyInstallScreen() {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [androidHint, setAndroidHint] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());
    setAndroid(isAndroidDevice());
    setInApp(isInAppBrowser());
    setHasPrompt(Boolean(getDeferredPrompt()));
    return subscribeInstallReady(() =>
      setHasPrompt(Boolean(getDeferredPrompt())),
    );
  }, []);

  const onInstall = useCallback(async () => {
    setNote(null);

    if (isStandaloneDisplay()) {
      setNote("Already installed — open from your home screen.");
      return;
    }

    // WhatsApp / Instagram / etc. cannot install PWAs — open real Chrome.
    if (isInAppBrowser() && isAndroidDevice()) {
      openInstallInChrome();
      return;
    }
    if (isInAppBrowser() && isIosDevice()) {
      setIosHint(true);
      return;
    }

    if (isIosDevice()) {
      setIosHint(true);
      return;
    }

    setInstalling(true);
    try {
      const outcome = await promptNativeInstall();
      if (outcome === "accepted") {
        setStandalone(true);
        setNote("Installed — check your home screen");
        return;
      }
      // No deferred prompt yet — show simple Chrome steps
      setAndroidHint(true);
    } finally {
      setInstalling(false);
    }
  }, []);

  if (standalone) {
    return (
      <main className="ru-force-light flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 rounded-[1.25rem] shadow"
        />
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-black">
          {BRAND.appName} is ready
        </h1>
        <p className="mt-2 max-w-xs text-sm text-gray-600">
          Open it from your home screen — look for the app icon.
        </p>
        <Link
          href="/"
          className="uber-press uber-btn-black mt-10 w-full max-w-sm"
        >
          Open Village Ride
        </Link>
      </main>
    );
  }

  return (
    <main className="ru-force-light relative flex min-h-dvh flex-col bg-white text-black">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 rounded-[1.5rem] shadow ring-1 ring-gray-200"
        />
        <p className="mt-8 text-xs font-semibold tracking-wide text-gray-500 uppercase">
          {BRAND.company}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-black sm:text-5xl">
          {BRAND.appName}
        </h1>
        <p className="mt-4 max-w-sm text-lg text-gray-600">
          {inApp
            ? `Open in ${android ? "Chrome" : "Safari"} to install — one tap from there.`
            : ios
              ? "Add Village Ride to your home screen in Safari."
              : hasPrompt
                ? "Tap once to install on your home screen."
                : "Install Village Ride — opens like an app, no Play Store needed."}
        </p>

        <button
          type="button"
          onClick={() => void onInstall()}
          disabled={installing}
          className="uber-press uber-btn-black mt-12 w-full max-w-sm !min-h-14 !text-xl"
        >
          {installing
            ? "Installing…"
            : inApp && android
              ? "Open in Chrome to install"
              : ios
                ? "How to install"
                : "Install app"}
        </button>

        {iosHint ? (
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left text-sm leading-relaxed text-black">
            {inApp ? (
              <>
                <p className="font-bold">First, leave {inAppBrowserName()}:</p>
                <p className="mt-2 text-gray-600">
                  1. Tap <strong className="text-black">⋯</strong> or{" "}
                  <strong className="text-black">Share</strong>
                </p>
                <p className="text-gray-600">
                  2. Tap <strong className="text-black">Open in Safari</strong>
                </p>
                <p className="mt-3 font-bold">Then in Safari:</p>
                <p className="mt-2 text-gray-600">3. Tap Share (square with ↑)</p>
                <p className="text-gray-600">4. Tap Add to Home Screen</p>
                <p className="text-gray-600">5. Tap Add</p>
              </>
            ) : (
              <>
                <p className="font-bold">On iPhone (Safari):</p>
                <p className="mt-2 text-gray-600">1. Tap Share (square with ↑)</p>
                <p className="text-gray-600">2. Tap Add to Home Screen</p>
                <p className="text-gray-600">3. Tap Add</p>
              </>
            )}
          </div>
        ) : null}

        {androidHint ? (
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left text-sm leading-relaxed text-black">
            <p className="font-bold">Install in Chrome</p>
            <p className="mt-2 text-gray-600">
              1. Tap the <strong className="text-black">⋮</strong> menu
            </p>
            <p className="text-gray-600">
              2. Tap <strong className="text-black">Install app</strong> or{" "}
              <strong className="text-black">Add to Home screen</strong>
            </p>
            <p className="text-gray-600">3. Tap Install</p>
            <a
              href={getAppInstallUrl()}
              className="uber-press mt-4 inline-flex w-full items-center justify-center rounded-xl bg-black py-3 text-sm font-bold text-white"
            >
              Refresh this page &amp; try again
            </a>
          </div>
        ) : null}

        {note ? (
          <p className="mt-4 text-sm font-semibold text-emerald-700">{note}</p>
        ) : !iosHint && !androidHint ? (
          <p className="mt-6 max-w-xs text-sm text-gray-500">
            Free · Works offline after install · No app store needed
          </p>
        ) : null}
      </div>

      <p className="relative z-10 pb-8 text-center text-xs text-gray-500">
        Already installed?{" "}
        <Link
          href="/"
          className="font-semibold text-black underline underline-offset-2"
        >
          Open the app
        </Link>
      </p>
    </main>
  );
}
