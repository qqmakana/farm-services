"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, ChevronRight, Clock, Search } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { Suspense } from "react";
import { getGuestProfile } from "@/lib/guest-profile";
import { listJobsByCustomerPhone } from "@/lib/actions";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";

const ICON = 2;
const GLOSS =
  "bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]";

type HomeMode = "ride" | "shops" | "courier";

const MODES: {
  id: HomeMode;
  label: string;
  href: string;
  src: string;
}[] = [
  { id: "ride", label: "Ride", href: "/", src: "/home/icons/car.png" },
  { id: "shops", label: "Shops", href: "/shops", src: "/home/icons/shops.png" },
  {
    id: "courier",
    label: "Courier",
    href: "/courier",
    src: "/home/icons/courier.png",
  },
];

const FOR_YOU: {
  href: string;
  label: string;
  src: string;
  badge?: string;
}[] = [
  { href: "/ride", label: "Trip", src: "/home/icons/car.png", badge: "20%" },
  { href: "/shops", label: "Shops", src: "/home/icons/shops.png" },
  { href: "/courier", label: "Send items", src: "/home/icons/courier.png" },
  { href: "/farm", label: "Farm", src: "/home/icons/farm.png", badge: "Promo" },
];

export function UberHome() {
  const router = useRouter();
  const [mode, setMode] = useState<HomeMode>("ride");
  const [laterOpen, setLaterOpen] = useState(false);
  const [recents, setRecents] = useState<
    { title: string; subtitle: string }[]
  >([]);

  useEffect(() => {
    const guest = getGuestProfile();
    if (!guest?.phone) return;
    void listJobsByCustomerPhone(guest.phone)
      .then((jobs) => {
        const places = jobs
          .map((j) => ({
            title: j.dropoff_landmark || j.pickup_landmark,
            subtitle:
              j.pickup_landmark && j.dropoff_landmark
                ? `From ${j.pickup_landmark}`
                : "Recent trip",
          }))
          .filter((p) => p.title);
        const unique = [
          ...new Map(places.map((p) => [p.title, p])).values(),
        ].slice(0, 2);
        setRecents(unique);
      })
      .catch(() => undefined);
  }, []);

  function openWhere() {
    if (mode === "shops") router.push("/shops");
    else if (mode === "courier") router.push("/courier");
    else router.push("/ride");
  }

  return (
    <main
      data-testid="uber-home"
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-[#f2f2f2] px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-display)] tracking-[-0.02em] text-[#0a0a0a]"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      <div
        data-testid="home-mode-tabs"
        className="flex items-end justify-around gap-1"
        role="tablist"
        aria-label="Ride, Shops, Courier"
      >
        {MODES.map((m) => {
          const selected = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setMode(m.id);
                if (m.id !== "ride") router.push(m.href);
              }}
              className={`uber-press relative flex min-h-14 flex-1 flex-col items-center gap-1 pb-2.5 text-[13px] ${
                selected
                  ? "font-bold text-[#0a0a0a]"
                  : "font-semibold text-[#6b6b6b]"
              }`}
            >
              <span className="relative h-9 w-9">
                <Image
                  src={m.src}
                  alt=""
                  fill
                  className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
                  sizes="36px"
                />
                {m.id === "shops" ? (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#06c167] ring-2 ring-[#f2f2f2]" />
                ) : null}
              </span>
              {m.label}
              {selected ? (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-11 -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        className={`mt-5 flex items-center gap-2 rounded-[9999px] py-1.5 pl-5 pr-1.5 ${GLOSS}`}
      >
        <button
          type="button"
          data-testid="home-where-to"
          onClick={openWhere}
          className="uber-press flex min-h-12 flex-1 items-center gap-3 text-left"
        >
          <Search
            className="h-5 w-5 shrink-0 text-[#0a0a0a]"
            strokeWidth={ICON}
            aria-hidden
          />
          <span className="text-[18px] font-semibold text-[#6b6b6b]">
            Where to?
          </span>
        </button>
        <button
          type="button"
          data-testid="home-later"
          onClick={() => setLaterOpen(true)}
          className="uber-press flex h-11 shrink-0 items-center gap-1.5 rounded-[9999px] bg-[#efefef] px-4 text-sm font-bold text-[#0a0a0a]"
        >
          <Calendar className="h-4 w-4" strokeWidth={ICON} aria-hidden />
          Later
        </button>
      </div>

      {recents.length > 0 ? (
        <ul
          className={`mt-4 overflow-hidden rounded-[28px] ${GLOSS}`}
          data-testid="home-recents"
        >
          {recents.map((place, i) => (
            <li key={place.title}>
              {i > 0 ? <div className="mx-5 h-px bg-[#ececec]" /> : null}
              <button
                type="button"
                onClick={() =>
                  router.push(`/ride?to=${encodeURIComponent(place.title)}`)
                }
                className="uber-press flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]">
                  <Clock
                    className="h-4 w-4 text-[#0a0a0a]"
                    strokeWidth={ICON}
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-[#0a0a0a]">
                    {place.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-medium text-[#6b6b6b]">
                    {place.subtitle}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[#c4c4c4]"
                  strokeWidth={ICON}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div data-testid="home-recents" className="sr-only">
          No recent Village Ride trips
        </div>
      )}

      <DriveSignupCard variant="compact" className="mt-4" />

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0a0a0a]">
            For you
          </h2>
          <Link
            href="/services"
            className={`uber-press flex h-8 w-8 items-center justify-center rounded-full ${GLOSS}`}
            aria-label="All services"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
        <div
          data-testid="service-circles"
          className="mt-4 flex gap-5 overflow-x-auto pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label="For you"
        >
          {FOR_YOU.map(({ href, label, src, badge }, i) => (
            <Link
              key={label}
              href={href}
              data-testid={`service-circle-${label.toLowerCase().replace(/\s+/g, "-")}`}
              data-primary={i === 0 ? "true" : "false"}
              className="uber-press relative flex w-[76px] shrink-0 flex-col items-center"
            >
              {badge ? (
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-[#f02d3a] px-1.5 py-[2px] text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(240,45,58,0.35)]">
                  {badge}
                </span>
              ) : null}
              <span className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.04]">
                <Image
                  src={src}
                  alt=""
                  width={58}
                  height={58}
                  className="h-14 w-14 object-contain"
                />
              </span>
              <span className="mt-2 text-center text-[13px] font-semibold text-[#0a0a0a]">
                {label}
              </span>
            </Link>
          ))}
        </div>
        <div data-testid="home-chips" className="sr-only">
          For you
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0a0a0a]">
          More ways to use Village Ride
        </h2>
        <Link
          href="/ride?when=later"
          className={`uber-press relative mt-4 block overflow-hidden rounded-[28px] ${GLOSS}`}
        >
          <span className="relative block aspect-[16/7] w-full bg-[#f4f4f5]">
            <Image
              src="/home/banner-night.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 28rem) 100vw, 28rem"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 to-transparent" />
            <span className="absolute bottom-3 left-4 text-base font-bold text-white">
              Reserve a night ride
            </span>
          </span>
        </Link>
      </section>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
