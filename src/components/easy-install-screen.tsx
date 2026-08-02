"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  getApkUrl,
  inAppBrowserName,
  isAndroidDevice,
  isInAppBrowser,
  isIosDevice,
  isStandaloneDisplay,
} from "@/lib/pwa-install";

/**
 * One-button install screen for WhatsApp shares.
 * Android: downloads the real signed app (.apk) directly — works from any browser,
 * including WhatsApp/Facebook's in-app browser, with no menu hunting required.
 */
export function EasyInstallScreen() {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());
    setAndroid(isAndroidDevice());
    setInApp(isInAppBrowser());
  }, []);

  const onInstall = useCallback(() => {
    if (ios) {
      setIosHint(true);
      return;
    }

    if (android) {
      setDownloading(true);
      // Trigger the .apk download directly — works inside WhatsApp too.
      window.location.href = getApkUrl();
      setTimeout(() => {
        setDownloading(false);
        setDownloadStarted(true);
      }, 1200);
      return;
    }

    // Desktop / unknown — send them to the apk anyway, browser will just download it.
    window.location.href = getApkUrl();
  }, [android, ios]);

  if (standalone) {
    return (
      <main className="ru-force-light flex min-h-dvh flex-col items-center justify-center bg-[var(--ru-canvas)] px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 rounded-[1.25rem] shadow-[var(--ru-shadow)]"
        />
        <h1 className="ru-page-title mt-8">
          {BRAND.appName} is ready
        </h1>
        <p className="ru-page-sub max-w-xs">
          Open it from your home screen — look for the app icon.
        </p>
        <Link
          href="/"
          className="ru-btn ru-btn-primary ru-btn-block mt-10 max-w-sm"
        >
          Open Village Ride
        </Link>
      </main>
    );
  }

  return (
    <main className="ru-force-light relative flex min-h-dvh flex-col bg-[var(--ru-canvas)] text-black">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 rounded-[1.5rem] shadow-[var(--ru-shadow)] ring-1 ring-[var(--ru-line)]"
        />
        <p className="ru-section-label mt-8">{BRAND.company}</p>
        <h1 className="ru-page-title mt-2 !text-4xl sm:!text-5xl">
          {BRAND.appName}
        </h1>
        <p className="ru-page-sub mt-4 max-w-sm !text-lg">
          {android
            ? "Tap once to download the app — works right here, no menus."
            : ios
              ? "Add Village Ride to your home screen."
              : "Tap once to get the app on your phone."}
        </p>

        <button
          type="button"
          onClick={onInstall}
          disabled={downloading}
          className="ru-btn ru-btn-primary ru-btn-block mt-12 max-w-sm !min-h-14 !text-xl"
        >
          {downloading ? "Downloading…" : android ? "Download app" : "Install app"}
        </button>

        {iosHint ? (
          <div className="ru-card mt-8 w-full max-w-sm p-4 text-left text-sm leading-relaxed text-black">
            {inApp ? (
              <>
                <p className="font-bold">First, leave {inAppBrowserName()}:</p>
                <p className="mt-2 text-[var(--ru-muted)]">
                  1. Tap <strong className="text-black">⋯</strong> or{" "}
                  <strong className="text-black">Share</strong> at the bottom of
                  the screen
                </p>
                <p className="text-[var(--ru-muted)]">
                  2. Tap <strong className="text-black">Open in Safari</strong>
                </p>
                <p className="mt-3 font-bold">Then in Safari:</p>
                <p className="mt-2 text-[var(--ru-muted)]">3. Tap the Share button</p>
                <p className="text-[var(--ru-muted)]">4. Tap Add to Home Screen</p>
                <p className="text-[var(--ru-muted)]">5. Tap Add</p>
              </>
            ) : (
              <>
                <p className="font-bold">On iPhone (Safari only):</p>
                <p className="mt-2 text-[var(--ru-muted)]">1. Tap the Share button</p>
                <p className="text-[var(--ru-muted)]">2. Tap Add to Home Screen</p>
                <p className="text-[var(--ru-muted)]">3. Tap Add</p>
              </>
            )}
          </div>
        ) : downloadStarted ? (
          <div className="ru-card mt-8 w-full max-w-sm p-4 text-left text-sm leading-relaxed text-black">
            <p className="font-bold">Almost there</p>
            <p className="mt-2 text-[var(--ru-muted)]">
              1. Open the downloaded file (check notifications)
            </p>
            <p className="text-[var(--ru-muted)]">2. Tap Install</p>
            <p className="text-[var(--ru-muted)]">
              3. If Android warns about the source, tap{" "}
              <strong className="text-black">Settings</strong> →{" "}
              <strong className="text-black">Allow</strong>, then Install again
            </p>
            <button
              type="button"
              onClick={onInstall}
              className="ru-btn ru-btn-primary ru-btn-block mt-4"
            >
              Download again
            </button>
          </div>
        ) : (
          <p className="mt-6 max-w-xs text-sm text-[var(--ru-muted)]">
            {android
              ? "Free · Works from WhatsApp, Chrome, or any browser"
              : "Free · No Play Store needed"}
          </p>
        )}
      </div>

      <p className="relative z-10 pb-8 text-center text-xs text-[var(--ru-muted)]">
        Already installed?{" "}
        <Link href="/" className="font-semibold text-black underline underline-offset-2">
          Open the app
        </Link>
      </p>
    </main>
  );
}
