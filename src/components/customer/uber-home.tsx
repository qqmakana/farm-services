"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CalendarClock, ChevronRight, Clock, Search } from "lucide-react";
import { CaptureReferral } from "@/components/referral/capture-referral";
import { HomeScheduleLaterModal } from "@/components/customer/home-schedule-later-modal";
import { getGuestProfile } from "@/lib/guest-profile";
import { listJobsByCustomerPhone } from "@/lib/actions";

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
  { href: "/farm", label: "Farm", src: "/home/icons/farm.png" },
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
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-sans)] text-black"
    >
      <Suspense fallback={null}>
        <CaptureReferral />
      </Suspense>

      <div
        data-testid="home-mode-tabs"
        className="flex items-end justify-around"
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
              className={`uber-press relative flex min-h-14 flex-1 flex-col items-center gap-1 pb-2.5 text-[15px] ${
                selected
                  ? "font-bold text-black"
                  : "font-medium text-[#6B6B6B]"
              }`}
            >
              <span className="relative h-10 w-10">
                <Image
                  src={m.src}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </span>
              {m.label}
              {selected ? (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-black" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
        <button
          type="button"
          data-testid="home-where-to"
          onClick={openWhere}
          className="uber-press flex min-h-12 flex-1 items-center gap-3 text-left"
        >
          <Search
            className="h-5 w-5 shrink-0 text-[#6B6B6B]"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-[17px] font-normal text-[#A6A6A6]">
            Where to?
          </span>
        </button>
        <span className="mx-1 h-8 w-px bg-[#EEEEEE]" aria-hidden />
        <button
          type="button"
          data-testid="home-later"
          onClick={() => setLaterOpen(true)}
          className="uber-press flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-[15px] font-medium text-black"
        >
          <CalendarClock className="h-4 w-4" strokeWidth={2} aria-hidden />
          Later
        </button>
      </div>

      {recents.length > 0 ? (
        <ul
          className="mt-4 overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white"
          data-testid="home-recents"
        >
          {recents.map((place, i) => (
            <li key={place.title}>
              {i > 0 ? <div className="mx-4 h-px bg-[#EEEEEE]" /> : null}
              <button
                type="button"
                onClick={() =>
                  router.push(`/ride?to=${encodeURIComponent(place.title)}`)
                }
                className="uber-press flex w-full items-center gap-4 px-4 py-4 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEEEE]">
                  <Clock
                    className="h-4 w-4 text-[#6B6B6B]"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-black">
                    {place.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-normal text-[#6B6B6B]">
                    {place.subtitle}
                  </span>
                </span>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-[#A6A6A6]"
                  strokeWidth={2}
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

      <section className="mt-6" data-testid="home-chips">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.3px] text-black">
            For you
          </h2>
          <Link
            href="/services"
            className="uber-press flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-[#EEEEEE]"
            aria-label="All services"
          >
            <ChevronRight className="h-4 w-4 text-black" strokeWidth={2} />
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
              className="uber-press relative flex w-[72px] shrink-0 flex-col items-center"
            >
              {badge ? (
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-[4px] bg-[#CB4040] px-1.5 py-[2px] text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
              <span className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full bg-[#EEEEEE]">
                <Image
                  src={src}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              </span>
              <span className="mt-2 text-center text-[13px] font-medium text-black">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <HomeScheduleLaterModal
        open={laterOpen}
        onClose={() => setLaterOpen(false)}
      />
    </main>
  );
}
