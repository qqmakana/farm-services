"use client";

import { useEffect, useState } from "react";
import {
  InstallHelpPanel,
  useInstallActions,
} from "@/components/install-share-bar";
import { OPERATING_LAUNCH } from "@/lib/launch";

/** Shown on Home when they opened the link and have not installed yet. */
export function HomeInstallCard() {
  const [ready, setReady] = useState(false);
  const { standalone, installing, install, ios, helpOpen, setHelpOpen } =
    useInstallActions();

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || standalone) return null;

  return (
    <section
      data-testid="home-install-card"
      className="mb-5 rounded-[20px] bg-black px-4 py-4 text-white"
    >
      <p className="text-[11px] font-bold tracking-[0.12em] text-[#f0c14b] uppercase">
        Not on Play Store yet
      </p>
      <p className="mt-1 text-[16px] font-bold leading-snug">
        Install Village Ride on your home screen
      </p>
      <p className="mt-1 text-[13px] text-white/70">
        Anyone can add it — no Google Play invite. Paid trips start{" "}
        {OPERATING_LAUNCH.when}.
      </p>
      <button
        type="button"
        data-testid="home-install-cta"
        onClick={() => void install()}
        disabled={installing}
        className="uber-press mt-3 flex min-h-12 w-full items-center justify-center rounded-full bg-white text-[15px] font-bold text-black disabled:opacity-60"
      >
        {installing ? "Opening…" : ios ? "How to install" : "Install app"}
      </button>
      {helpOpen ? (
        <InstallHelpPanel ios={ios} onClose={() => setHelpOpen(false)} />
      ) : null}
    </section>
  );
}
