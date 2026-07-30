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
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--ru-brand)] px-6 text-center text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 rounded-[1.25rem] shadow-lg"
        />
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl font-bold">
          {BRAND.appName} is ready
        </h1>
        <p className="mt-3 max-w-xs text-base text-white/85">
          Open it from your home screen — look for the green icon.
        </p>
        <Link
          href="/"
          className="mt-10 w-full max-w-sm rounded-2xl bg-white py-4 text-lg font-bold text-[var(--ru-brand)]"
        >
          Open Village Ride
        </Link>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-[var(--ru-brand)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, #2d7a5c, transparent), radial-gradient(ellipse 60% 40% at 100% 100%, #0f2e24, transparent)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 rounded-[1.5rem] shadow-xl ring-4 ring-white/20"
        />
        <p className="mt-8 text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">
          {BRAND.company}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
          {BRAND.appName}
        </h1>
        <p className="mt-4 max-w-sm text-lg text-white/90">
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
          className="mt-12 w-full max-w-sm rounded-2xl bg-white py-5 text-xl font-bold text-[var(--ru-brand)] shadow-lg active:scale-[0.98] disabled:opacity-70"
        >
          {downloading ? "Downloading…" : android ? "Download app" : "Install app"}
        </button>

        {iosHint ? (
          <div className="mt-8 w-full max-w-sm rounded-2xl bg-white/10 p-4 text-left text-sm leading-relaxed text-white">
            {inApp ? (
              <>
                <p className="font-bold">First, leave {inAppBrowserName()}:</p>
                <p className="mt-2">
                  1. Tap <strong>⋯</strong> or <strong>Share</strong> at the bottom of the
                  screen
                </p>
                <p>
                  2. Tap <strong>Open in Safari</strong>
                </p>
                <p className="mt-3 font-bold">Then in Safari:</p>
                <p className="mt-2">3. Tap the Share button</p>
                <p>4. Tap Add to Home Screen</p>
                <p>5. Tap Add</p>
              </>
            ) : (
              <>
                <p className="font-bold">On iPhone (Safari only):</p>
                <p className="mt-2">1. Tap the Share button</p>
                <p>2. Tap Add to Home Screen</p>
                <p>3. Tap Add</p>
              </>
            )}
          </div>
        ) : downloadStarted ? (
          <div className="mt-8 w-full max-w-sm rounded-2xl bg-white/10 p-4 text-left text-sm leading-relaxed text-white">
            <p className="font-bold">Almost there</p>
            <p className="mt-2">1. Open the downloaded file (check notifications)</p>
            <p>2. Tap Install</p>
            <p>
              3. If Android warns about the source, tap <strong>Settings</strong> →{" "}
              <strong>Allow</strong>, then Install again
            </p>
            <button
              type="button"
              onClick={onInstall}
              className="mt-4 w-full rounded-xl bg-white py-3 text-base font-bold text-[var(--ru-brand)]"
            >
              Download again
            </button>
          </div>
        ) : (
          <p className="mt-6 max-w-xs text-sm text-white/65">
            {android
              ? "Free · Works from WhatsApp, Chrome, or any browser"
              : "Free · No Play Store needed"}
          </p>
        )}
      </div>

      <p className="relative z-10 pb-8 text-center text-xs text-white/50">
        Already installed?{" "}
        <Link href="/" className="underline underline-offset-2">
          Open the app
        </Link>
      </p>
    </main>
  );
}
