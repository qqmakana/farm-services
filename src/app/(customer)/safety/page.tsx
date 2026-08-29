"use client";

import { useEffect, useState } from "react";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { useCountry } from "@/components/country/country-provider";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import {
  getSafetySettings,
  isValidPanicCode,
  setSafetySettings,
} from "@/lib/safety-settings";
import {
  UBER_BTN_BLACK,
  UBER_H1,
  UBER_INPUT,
  UBER_PAGE,
  UBER_SUB,
} from "@/components/customer/uber-chrome";

function SafetyContent() {
  const { countryCode } = useCountry();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = getSafetySettings();
    setName(s.emergency_name);
    setPhone(s.emergency_phone);
    setCode(s.panic_code);
  }, []);

  function save() {
    setSafetySettings({
      emergency_name: name,
      emergency_phone: phone,
      panic_code: code,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main data-testid="safety-page" className={UBER_PAGE}>
      <h1 className={UBER_H1}>Safety</h1>
      <p className={UBER_SUB}>
        Three tools that stay with you on every trip. Nothing here texts anyone
        automatically — you stay in control.
      </p>

      <section className="mt-6 space-y-3 rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE]">
        <h2 className="text-[17px] font-bold">Emergency contact</h2>
        <p className="text-[13px] text-[#6B6B6B]">
          If you do not tap “I arrived safely”, we will ask you to message this
          person. We do not send SMS for you.
        </p>
        <input
          className={UBER_INPUT}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Emergency contact name"
        />
        <input
          className={UBER_INPUT}
          placeholder={formatPhonePlaceholder(countryCode)}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          aria-label="Emergency contact phone"
        />
      </section>

      <section className="mt-4 space-y-3 rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE]">
        <h2 className="text-[17px] font-bold">Panic code</h2>
        <p className="text-[13px] text-[#6B6B6B]">
          Four digits. Type them as a word in trip chat. Village Ride logs a
          silent SOS. Then you can open SMS or WhatsApp to this contact.
        </p>
        <input
          className={UBER_INPUT}
          placeholder="••••"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          inputMode="numeric"
          maxLength={4}
          aria-label="Panic code"
          data-testid="panic-code-input"
        />
        {code && !isValidPanicCode(code) ? (
          <p className="text-[13px] text-[#CB4040]">Use exactly 4 digits.</p>
        ) : null}
      </section>

      <section className="mt-4 space-y-2 rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE]">
        <h2 className="text-[17px] font-bold">On every trip</h2>
        <p className="text-[13px] text-[#6B6B6B]">
          1. After accept, the driver sends a live photo. Confirm it before
          pickup.
        </p>
        <p className="text-[13px] text-[#6B6B6B]">
          2. When the trip ends, tap “I arrived safely”. If you do not, we
          prompt you to ping your contact.
        </p>
        <p className="text-[13px] text-[#6B6B6B]">
          3. SOS is still on the trip screen. The panic code is the silent
          option.
        </p>
      </section>

      <button type="button" className={`${UBER_BTN_BLACK} mt-6`} onClick={save}>
        {saved ? "Saved" : "Save safety settings"}
      </button>
    </main>
  );
}

export default function SafetyPage() {
  return (
    <OnboardingGate>
      <SafetyContent />
    </OnboardingGate>
  );
}
