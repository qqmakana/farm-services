"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  clearDeferredPrompt,
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
 * One-button install screen for WhatsApp shares.
 * Android in WhatsApp → one tap opens Chrome → one tap installs.
 */
export function EasyInstallScreen() {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [chromeHint, setChromeHint] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());
    setAndroid(isAndroidDevice());
    setInApp(isInAppBrowser());
    setCanPrompt(Boolean(getDeferredPrompt()));
    return subscribeInstallReady(() => {
      setCanPrompt(Boolean(getDeferredPrompt()));
      if (isStandaloneDisplay()) {
        setStandalone(true);
        setDone(true);
      }
    });
  }, []);

  const onInstall = useCallback(async () => {
    if (busy) return;
    setBusy(true);

    try {
      // Already in WhatsApp/Facebook → jump straight into Chrome (one tap).
      if (inApp && android) {
        openInstallInChrome();
        return;
      }

      if (ios) {
        setIosHint(true);
        return;
      }

      const outcome = await promptNativeInstall();
      if (outcome === "accepted") {
        clearDeferredPrompt();
        setDone(true);
        setStandalone(true);
        return;
      }

      if (outcome === "dismissed") return;

      // In Chrome but prompt not ready — show a simple follow-up, don't loop.
      setChromeHint(true);
    } finally {
      setBusy(false);
    }
  }, [android, busy, inApp, ios]);

  if (standalone || done) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--ru-brand)] px-6 text-center text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={88}
          height={88}
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
          {inApp && android
            ? "Tap once below — we open Chrome and install for you."
            : canPrompt
              ? "Tap once to add the app to your phone."
              : ios
                ? "Add Village Ride to your home screen."
                : "Tap once to install the app on your phone."}
        </p>

        <button
          type="button"
          onClick={onInstall}
          disabled={busy}
          className="mt-12 w-full max-w-sm rounded-2xl bg-white py-5 text-xl font-bold text-[var(--ru-brand)] shadow-lg active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? "Opening…" : "Install app"}
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
        ) : chromeHint ? (
          <div className="mt-8 w-full max-w-sm rounded-2xl bg-white/10 p-4 text-left text-sm leading-relaxed text-white">
            <p className="font-bold">Almost there</p>
            <p className="mt-2">
              Tap the <strong>⋮</strong> menu at the top of Chrome, then tap{" "}
              <strong>Install app</strong>.
            </p>
            <button
              type="button"
              onClick={onInstall}
              className="mt-4 w-full rounded-xl bg-white py-3 text-base font-bold text-[var(--ru-brand)]"
            >
              Try Install again
            </button>
          </div>
        ) : (
          <p className="mt-6 max-w-xs text-sm text-white/65">
            {inApp && android
              ? "Chrome will open — then tap Install once more."
              : inApp && ios
                ? `Works best outside ${inAppBrowserName()} — tap Install for steps.`
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
