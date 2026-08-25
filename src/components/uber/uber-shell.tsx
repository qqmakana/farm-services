"use client";

import dynamic from "next/dynamic";
import { AppLink } from "@/components/ui/app-link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, HelpCircle, MapPin } from "lucide-react";
import { ShareAppButton } from "@/components/share-app-button";
import { ServicePills } from "@/components/uber/service-pills";
import { useCountry } from "@/components/country/country-provider";
import { listNearbySupplyPins } from "@/lib/actions-supply";
import { BRAND } from "@/lib/brand";
import type { JobMapPin } from "@/components/maps/ride-map-canvas";
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";

const VillageMap = dynamic(
  () =>
    import("@/components/maps/village-map").then((m) => m.VillageMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#e8e8e8] text-sm text-black/50">
        Loading map…
      </div>
    ),
  },
);

export function UberShell({
  children,
  pin = null,
  dropoffPin = null,
  driverPin = null,
  onMapPin,
  backHref,
  title,
  showTabBar = false,
  showServicePills = false,
  floatingSearch = null,
  stickyAction = null,
  initialSnap = "peek",
  snap: snapProp,
  onSnapChange,
  onBack,
  enterFromPeek = false,
  hideLocationHint = false,
  autoSnapOnRoute = true,
  topRightLabel,
}: {
  children: ReactNode;
  pin?: { lat: number; lng: number } | null;
  dropoffPin?: { lat: number; lng: number } | null;
  /** Assigned driver GPS — rider trip tracking. */
  driverPin?: { lat: number; lng: number } | null;
  /** Tap map → pin. Landmark text in the sheet stays active too. */
  onMapPin?: (pin: { lat: number; lng: number }) => void;
  backHref?: string;
  /** In-page back (search ↔ choose ride). Falls back to backHref. */
  onBack?: () => void;
  title?: string;
  /** Reserve space for the customer bottom tab bar (Home). */
  showTabBar?: boolean;
  /** Uber-style service category pills over the map */
  showServicePills?: boolean;
  /** Optional floating “Where to?” card over the map */
  floatingSearch?: ReactNode;
  /** Pinned bottom CTA inside the sheet (Book Now) */
  stickyAction?: ReactNode;
  /** Starting sheet height. Ride checkout uses mid so the map stays visible. */
  initialSnap?: "peek" | "mid" | "full";
  snap?: "peek" | "mid" | "full";
  onSnapChange?: (next: "peek" | "mid" | "full") => void;
  /** Slide the sheet up on first paint (Home → search). */
  enterFromPeek?: boolean;
  hideLocationHint?: boolean;
  /** When false, dropoff does not force mid snap (live trip). */
  autoSnapOnRoute?: boolean;
  topRightLabel?: string;
}) {
  const { country } = useCountry();
  const [cars, setCars] = useState<JobMapPin[]>([]);
  const bottomInset = showTabBar
    ? "calc(4rem + env(safe-area-inset-bottom, 0px))"
    : "0px";

  type SheetSnap = "peek" | "mid" | "full";
  const SNAP_PCT: Record<SheetSnap, number> = {
    peek: 28,
    mid: 58,
    full: 86,
  };
  const [snapState, setSnapState] = useState<SheetSnap>(
    enterFromPeek ? "peek" : initialSnap,
  );
  const snap = snapProp ?? snapState;
  const setSnap = useCallback(
    (next: SheetSnap | ((prev: SheetSnap) => SheetSnap)) => {
      setSnapState((prev) => {
        const resolved = typeof next === "function" ? next(snapProp ?? prev) : next;
        onSnapChange?.(resolved);
        return resolved;
      });
    },
    [onSnapChange, snapProp],
  );
  const [dragPx, setDragPx] = useState(0);
  const dragStartY = useRef(0);
  const dragStartSnap = useRef<SheetSnap>("peek");
  const dragging = useRef(false);
  const sawDropoff = useRef(false);

  useEffect(() => {
    if (!enterFromPeek) return;
    const id = window.setTimeout(() => setSnap(initialSnap === "mid" ? "mid" : "full"), 40);
    return () => window.clearTimeout(id);
  }, [enterFromPeek, initialSnap, setSnap]);

  useEffect(() => {
    if (snapProp) setSnapState(snapProp);
  }, [snapProp]);

  useEffect(() => {
    if (!autoSnapOnRoute) return;
    if (dropoffPin) setSnap("mid");
    else if (sawDropoff.current) setSnap("full");
    sawDropoff.current = Boolean(dropoffPin);
  }, [autoSnapOnRoute, dropoffPin, setSnap]);

  useEffect(() => {
    const origin = pin ?? country.mapCenter;
    if (!origin) return;
    let cancelled = false;
    const load = () => {
      void listNearbySupplyPins(origin.lat, origin.lng)
        .then((next) => {
          if (!cancelled) setCars(next);
        })
        .catch(() => {
          if (!cancelled) setCars([]);
        });
    };
    const delay = window.setTimeout(load, 400);
    const poll = window.setInterval(load, 8_000);
    return () => {
      cancelled = true;
      window.clearTimeout(delay);
      window.clearInterval(poll);
    };
  }, [pin?.lat, pin?.lng, country.mapCenter.lat, country.mapCenter.lng]);

  const applySnapFromDrag = useCallback((dy: number, from: SheetSnap) => {
    const order: SheetSnap[] = ["peek", "mid", "full"];
    const idx = order.indexOf(from);
    if (dy > 40) setSnap(order[Math.max(0, idx - 1)]);
    else if (dy < -40) setSnap(order[Math.min(2, idx + 1)]);
  }, []);

  function onHandlePointerDown(e: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartSnap.current = snap;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    setDragPx(e.clientY - dragStartY.current);
  }

  function onHandlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    const dy = e.clientY - dragStartY.current;
    setDragPx(0);
    if (Math.abs(dy) < 10) {
      setSnap((s) => (s === "peek" ? "mid" : s === "mid" ? "peek" : "mid"));
      return;
    }
    applySnapFromDrag(dy, dragStartSnap.current);
  }

  const sheetHeight = `clamp(11.5rem, calc(${SNAP_PCT[snap]}% - ${dragPx}px), 90%)`;

  return (
    <div
      className="ru-force-light fixed top-0 left-1/2 z-[45] w-full max-w-md -translate-x-1/2 overflow-hidden bg-[#1b2433] font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--ru-ink)]"
      style={{ bottom: bottomInset }}
    >
      {/* Full-screen map foundation */}
      <div className="absolute inset-0 z-0">
        <ClientErrorBoundary
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#1a1a1a] px-6 text-center text-sm text-white/80">
              <MapPin className="h-8 w-8 text-white/50" aria-hidden />
              <p>Map unavailable on this device — you can still book below.</p>
            </div>
          }
        >
          <VillageMap
            pin={pin}
            dropoff={dropoffPin}
            driverLocation={driverPin}
            center={country.mapCenter}
            cars={driverPin ? [] : cars}
            onSelect={
              onMapPin
                ? (next) => {
                    if (snap === "full") setSnap("mid");
                    onMapPin(next);
                  }
                : undefined
            }
          />
        </ClientErrorBoundary>
      </div>

      {/* Top chrome + optional Where-to bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="uber-press flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
              </button>
            ) : backHref ? (
              <AppLink
                href={backHref}
                className="uber-press flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
              </AppLink>
            ) : (
              <AppLink
                href="/"
                className="uber-press flex items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3.5 pl-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full bg-black object-cover"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold tracking-tight text-[var(--ru-ink)]">
                    {title ?? BRAND.appName}
                  </span>
                  <span
                    data-testid="country-indicator"
                    className="block text-[10px] font-medium tracking-wide text-[var(--ru-muted)] uppercase"
                  >
                    {country.flag} {country.currencySymbol}
                    {country.currency}
                  </span>
                </span>
              </AppLink>
            )}
          </div>
          {(onBack || backHref) ? (
            <span
              data-testid="country-indicator"
              className="rounded-full bg-white px-3 py-2 text-[12px] font-bold tracking-wide text-[#0a0a0a] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
            >
              {topRightLabel ?? `${country.flag} ${country.currency}`}
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <AppLink
                href="/help"
                className="uber-press flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-black shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur"
                aria-label="Help"
              >
                <HelpCircle className="h-5 w-5" aria-hidden />
              </AppLink>
              <div className="rounded-full bg-white/95 p-1 shadow-[0_4px_24px_rgba(0,0,0,0.08)] [&_button]:rounded-full">
                <ShareAppButton />
              </div>
            </div>
          )}
        </div>
        {showServicePills ? (
          <div className="pointer-events-auto mt-3 rounded-[28px] bg-white/95 px-1 pt-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] backdrop-blur">
            <ServicePills />
          </div>
        ) : null}
        {floatingSearch ? (
          <div className="pointer-events-auto mt-3">{floatingSearch}</div>
        ) : null}
      </div>

        {onMapPin && !hideLocationHint && !floatingSearch && !showServicePills ? (
        <div className="pointer-events-none absolute inset-x-0 top-[5.5rem] z-30 flex justify-center px-4">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md backdrop-blur">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {pin
              ? "Your location · tap map to adjust"
              : "Finding your location…"}
          </p>
        </div>
      ) : null}

      {/* Native-style bottom sheet over the map */}
      <div
        data-testid="bottom-sheet"
        data-sheet-snap={snap}
        className={`ru-sheet absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden ${
          dragPx !== 0
            ? ""
            : "transition-[height] duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]"
        }`}
        style={{
          height: sheetHeight,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
        }}
        onFocusCapture={(e) => {
          const tag = (e.target as HTMLElement).tagName;
          if (tag === "INPUT" || tag === "TEXTAREA") setSnap("full");
        }}
        onBlurCapture={() => {
          if (!autoSnapOnRoute) return;
          window.setTimeout(() => {
            const active = document.activeElement;
            const sheet = document.querySelector("[data-testid='bottom-sheet']");
            if (sheet && active && sheet.contains(active)) return;
            setSnap(dropoffPin ? "mid" : "peek");
          }, 180);
        }}
      >
        <div
          data-testid="drag-handle"
          className="flex shrink-0 cursor-grab touch-none flex-col items-center active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          role="button"
          tabIndex={0}
          aria-label="Drag to show or hide the map"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSnap((s) => (s === "peek" ? "mid" : "peek"));
            }
          }}
        >
          <div className="ru-sheet-handle !my-3" />
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 ${
            stickyAction ? "pb-2" : showTabBar ? "pb-4" : "pb-[max(1rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {children}
        </div>
        {stickyAction ? (
          <div className="shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {stickyAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}
