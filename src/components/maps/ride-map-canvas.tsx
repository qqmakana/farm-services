"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { type GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_STYLE_DRIVER,
  MAPBOX_STYLE_RIDER,
  MAPBOX_TOKEN,
  type MapPin,
  type MapStyleVariant,
} from "@/lib/mapbox";
import { getDrivingRouteAction } from "@/lib/actions-mapbox";

export type JobMapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

const EMPTY_JOBS: JobMapPin[] = [];
const EMPTY_CARS: JobMapPin[] = [];
const MAP_CAM_KEY = "vr_map_cam_v1";

type SavedCam = {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

function readSavedCamera(fallback: MapPin): SavedCam | null {
  try {
    const raw = sessionStorage.getItem(MAP_CAM_KEY);
    if (!raw) return null;
    const cam = JSON.parse(raw) as SavedCam;
    if (
      !Number.isFinite(cam.lng) ||
      !Number.isFinite(cam.lat) ||
      !Number.isFinite(cam.zoom)
    ) {
      return null;
    }
    const dlat = cam.lat - fallback.lat;
    const dlng = cam.lng - fallback.lng;
    if (dlat * dlat + dlng * dlng > 0.25) return null;
    return cam;
  } catch {
    return null;
  }
}

function writeSavedCamera(map: mapboxgl.Map) {
  try {
    const c = map.getCenter();
    sessionStorage.setItem(
      MAP_CAM_KEY,
      JSON.stringify({
        lng: c.lng,
        lat: c.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      }),
    );
  } catch {
    /* private mode */
  }
}

function shortCallout(raw: string) {
  const base = (raw.split(",")[0] || raw).trim();
  if (base.length <= 22) return base;
  return `${base.slice(0, 21)}…`;
}

function pinEl(kind: "pickup" | "dropoff" | "you" | "job" | "car") {
  const el = document.createElement("div");
  el.className = `vr-map-pin vr-map-pin-${kind}`;
  el.setAttribute("aria-hidden", "true");
  return el;
}

function labeledPinEl(opts: {
  kind: "pickup" | "dropoff";
  title: string;
  eta?: string | null;
  radar?: boolean;
}) {
  const wrap = document.createElement("div");
  wrap.className = "vr-map-labeled";
  wrap.setAttribute("aria-hidden", "true");

  const callout = document.createElement("div");
  callout.className = "vr-map-callout";
  if (opts.eta) {
    const eta = document.createElement("div");
    eta.className = "vr-map-callout-eta";
    eta.textContent = opts.eta;
    callout.appendChild(eta);
  }
  const name = document.createElement("div");
  name.className = "vr-map-callout-name";
  name.textContent = `${shortCallout(opts.title)} ›`;
  callout.appendChild(name);
  wrap.appendChild(callout);

  const pin = pinEl(opts.kind);
  if (opts.radar) pin.classList.add("vr-map-pin-radar");
  wrap.appendChild(pin);
  return wrap;
}

function emptyRoute() {
  return { type: "FeatureCollection" as const, features: [] };
}

function add3dBuildings(map: mapboxgl.Map, variant: "rider" | "driver") {
  if (map.getLayer("vr-3d-buildings")) return;
  if (!map.getSource("composite")) return;
  try {
    map.setLayoutProperty("building", "visibility", "none");
  } catch {
    /* layer name differs */
  }
  const labelLayerId = map
    .getStyle()
    .layers?.find(
      (layer) =>
        layer.type === "symbol" &&
        layer.layout &&
        "text-field" in layer.layout,
    )?.id;
  map.addLayer(
    {
      id: "vr-3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", ["get", "extrude"], "true"],
      type: "fill-extrusion",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": variant === "driver" ? "#222222" : "#c8c8c8",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.82,
      },
    },
    labelLayerId,
  );
}

function hidePoiLabels(map: mapboxgl.Map) {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    if (!/poi|transit/i.test(layer.id)) continue;
    try {
      map.setLayoutProperty(layer.id, "visibility", "none");
    } catch {
      /* layer id differs by style version */
    }
  }
}

function styleRiderBasemap(map: mapboxgl.Map) {
  const paint = (id: string, prop: string, value: string) => {
    try {
      if (!map.getLayer(id)) return;
      (map.setPaintProperty as (layer: string, name: string, val: string) => void)(
        id,
        prop,
        value,
      );
    } catch {
      /* optional */
    }
  };
  paint("land", "background-color", "#E5E3DF");
  paint("background", "background-color", "#E5E3DF");
  paint("water", "fill-color", "#AAD3DF");
  paint("national-park", "fill-color", "#D0E3D0");
  paint("landcover", "fill-color", "#D0E3D0");
  hidePoiLabels(map);
}

function configureBasemap(
  map: mapboxgl.Map,
  cinematic: boolean,
  variant: "rider" | "driver",
) {
  if (variant === "rider") styleRiderBasemap(map);
  if (cinematic && typeof window !== "undefined") {
    const lowEnd =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory != null &&
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 2;
    if (!lowEnd) add3dBuildings(map, variant);
  }
}

function ensureRouteLayer(map: mapboxgl.Map, variant: "rider" | "driver") {
  const rider = variant === "rider";
  const color = rider ? "#000000" : "#E8E8E8";
  if (map.getSource("vr-route")) {
    try {
      map.setPaintProperty("vr-route-glow", "line-color", color);
      map.setPaintProperty("vr-route-line", "line-color", color);
      map.setPaintProperty("vr-route-line", "line-width", rider ? 6 : 4);
    } catch {
      /* not ready */
    }
    return;
  }
  map.addSource("vr-route", {
    type: "geojson",
    data: emptyRoute(),
  });
  map.addLayer({
    id: "vr-route-glow",
    type: "line",
    source: "vr-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": rider ? 14 : 12,
      "line-opacity": rider ? 0.18 : 0.28,
      "line-color": color,
      "line-blur": 4,
    },
  });
  map.addLayer({
    id: "vr-route-line",
    type: "line",
    source: "vr-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": rider ? 6 : 4,
      "line-opacity": 1,
      "line-color": color,
    },
  });
}

export function RideMapCanvas({
  center,
  pin = null,
  dropoff = null,
  driverLocation = null,
  jobs = EMPTY_JOBS,
  cars = EMPTY_CARS,
  onSelect,
  onSelectJob,
  cinematic = true,
  searchingRadar = false,
  variant = "rider",
  className = "",
  pickupLabel = null,
  dropoffLabel = null,
  pickupEtaMins = null,
  paddingBottom = 40,
}: {
  center: MapPin;
  pin?: MapPin | null;
  dropoff?: MapPin | null;
  driverLocation?: MapPin | null;
  jobs?: JobMapPin[];
  cars?: JobMapPin[];
  onSelect?: (pin: MapPin) => void;
  onSelectJob?: (id: string) => void;
  cinematic?: boolean;
  searchingRadar?: boolean;
  variant?: MapStyleVariant;
  className?: string;
  pickupLabel?: string | null;
  dropoffLabel?: string | null;
  pickupEtaMins?: number | null;
  paddingBottom?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const syncRef = useRef<() => void>(() => {});
  const onSelectRef = useRef(onSelect);
  const onSelectJobRef = useRef(onSelectJob);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routeLine, setRouteLine] = useState<[number, number][] | null>(null);
  onSelectRef.current = onSelect;
  onSelectJobRef.current = onSelectJob;

  const stateRef = useRef({
    center,
    pin,
    dropoff,
    driverLocation,
    jobs,
    cars,
    cinematic,
    searchingRadar,
    variant,
    routeLine,
    pickupLabel,
    dropoffLabel,
    pickupEtaMins,
    paddingBottom,
  });
  stateRef.current = {
    center,
    pin,
    dropoff,
    driverLocation,
    jobs,
    cars,
    cinematic,
    searchingRadar,
    variant,
    routeLine,
    pickupLabel,
    dropoffLabel,
    pickupEtaMins,
    paddingBottom,
  };

  useEffect(() => {
    if (!pin || !dropoff) {
      setRouteLine(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void getDrivingRouteAction(pin, dropoff)
        .then((route) => {
          if (!cancelled) setRouteLine(route.geometry.coordinates);
        })
        .catch(() => {
          if (!cancelled) {
            setRouteLine([
              [pin.lng, pin.lat],
              [dropoff.lng, dropoff.lat],
            ]);
          }
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pin, dropoff]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      setMapError("Mapbox token missing");
      return;
    }

    const lowEnd =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory != null &&
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 2;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    let map: mapboxgl.Map;
    const savedCam = readSavedCamera(center);
    try {
      map = new mapboxgl.Map({
        container: wrap,
        style:
          variant === "driver" ? MAPBOX_STYLE_DRIVER : MAPBOX_STYLE_RIDER,
        center: savedCam
          ? [savedCam.lng, savedCam.lat]
          : [center.lng, center.lat],
        zoom: savedCam?.zoom ?? 15.5,
        pitch: savedCam?.pitch ?? (cinematic && !lowEnd ? 45 : 0),
        bearing: savedCam?.bearing ?? (cinematic && !lowEnd ? -18 : 0),
        attributionControl: true,
        logoPosition: "bottom-left",
        minZoom: variant === "driver" ? 3 : 10,
        maxPitch: lowEnd ? 0 : 62,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "Map failed to start");
      return;
    }
    mapRef.current = map;

    const sync = () => {
      const m = mapRef.current;
      if (!m?.isStyleLoaded()) return;
      const s = stateRef.current;
      configureBasemap(m, s.cinematic, s.variant);
      ensureRouteLayer(m, s.variant);

      const source = m.getSource("vr-route") as GeoJSONSource | undefined;
      if (source) {
        if (s.pin && s.dropoff && s.routeLine && s.routeLine.length >= 2) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: s.routeLine },
          });
        } else {
          source.setData(emptyRoute());
        }
      }

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      const add = (
        lngLat: [number, number],
        kind: "pickup" | "dropoff" | "you" | "job" | "car",
        job?: JobMapPin,
        labeled?: { title: string; eta?: string | null },
      ) => {
        const el =
          labeled && (kind === "pickup" || kind === "dropoff")
            ? labeledPinEl({
                kind,
                title: labeled.title,
                eta: labeled.eta,
                radar: kind === "pickup" && s.searchingRadar,
              })
            : pinEl(kind);
        if (kind === "pickup" && s.searchingRadar && !labeled) {
          el.classList.add("vr-map-pin-radar");
        }
        if (job) {
          el.title = job.label;
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            onSelectJobRef.current?.(job.id);
          });
        }
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: labeled ? "bottom" : "center",
        })
          .setLngLat(lngLat)
          .addTo(m);
        markersRef.current.push(marker);
      };

      if (s.driverLocation) {
        add(
          [s.driverLocation.lng, s.driverLocation.lat],
          s.variant === "driver" ? "you" : "car",
        );
      }
      const pickupEta =
        s.pickupEtaMins != null && s.pickupEtaMins > 0
          ? `${Math.round(s.pickupEtaMins)} MIN`
          : null;
      if (s.pin) {
        add(
          [s.pin.lng, s.pin.lat],
          "pickup",
          undefined,
          s.pickupLabel
            ? { title: s.pickupLabel, eta: pickupEta }
            : undefined,
        );
      } else if (!s.driverLocation) {
        add([s.center.lng, s.center.lat], "pickup");
      }
      if (s.dropoff) {
        add(
          [s.dropoff.lng, s.dropoff.lat],
          "dropoff",
          undefined,
          s.dropoffLabel ? { title: s.dropoffLabel } : undefined,
        );
      }
      for (const car of s.cars) {
        add([car.lng, car.lat], "car");
      }
      for (const job of s.jobs) {
        add([job.lng, job.lat], "job", job);
      }

      if (s.pin && s.dropoff) {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([s.pin.lng, s.pin.lat])
          .extend([s.dropoff.lng, s.dropoff.lat]);
        if (s.driverLocation) {
          bounds.extend([s.driverLocation.lng, s.driverLocation.lat]);
        }
        m.fitBounds(bounds, {
          padding: {
            top: s.cinematic ? 96 : 80,
            bottom: Math.max(s.paddingBottom, s.cinematic ? 260 : 40),
            left: s.cinematic ? 56 : 48,
            right: s.cinematic ? 56 : 48,
          },
          maxZoom: 15.6,
          pitch: s.cinematic ? 45 : 0,
          duration: 900,
          essential: true,
        });
        return;
      }

      if (s.pin && s.driverLocation) {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([s.pin.lng, s.pin.lat])
          .extend([s.driverLocation.lng, s.driverLocation.lat]);
        m.fitBounds(bounds, {
          padding: {
            top: s.cinematic ? 96 : 80,
            bottom: Math.max(s.paddingBottom, s.cinematic ? 180 : 40),
            left: s.cinematic ? 56 : 48,
            right: s.cinematic ? 56 : 48,
          },
          maxZoom: 15.6,
          pitch: s.cinematic ? 45 : 0,
          duration: 900,
          essential: true,
        });
        return;
      }

      const focus = s.pin ?? s.driverLocation ?? s.center;
      if (savedCam && !s.pin && !s.driverLocation) return;
      m.easeTo({
        center: [focus.lng, focus.lat],
        zoom: s.pin || s.driverLocation ? 15.5 : 13.4,
        pitch: s.cinematic ? 45 : 0,
        bearing: s.cinematic ? -18 : 0,
        duration: 700,
        essential: true,
      });
    };

    syncRef.current = sync;
    map.on("style.load", sync);
    map.on("load", () => setMapReady(true));
    map.on("error", (event) => {
      const message = event.error?.message ?? "Map failed to load";
      if (/token|401|403|style/i.test(message)) setMapError(message);
    });
    map.on("click", (e) => {
      onSelectRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    map.on("moveend", () => writeSavedCamera(map));

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(wrap);

    return () => {
      writeSavedCamera(map);
      ro.disconnect();
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Created once; pin updates go through syncRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncRef.current();
  }, [
    pin,
    dropoff,
    driverLocation,
    jobs,
    cars,
    center.lat,
    center.lng,
    cinematic,
    searchingRadar,
    routeLine,
    pickupLabel,
    dropoffLabel,
    pickupEtaMins,
    paddingBottom,
  ]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        ref={wrapRef}
        data-testid="ride-map"
        className={`vr-mapbox h-full w-full ${
          variant === "rider" ? "bg-[#F5F5F5]" : "bg-[#1a1a1a]"
        }`}
      />
      {!mapReady && !mapError ? (
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-[#F5F5F5]">
          <span className="vr-map-pulse" aria-hidden />
        </div>
      ) : null}
      {mapError ? (
        <p className="absolute inset-x-3 top-24 z-10 rounded-lg bg-black/80 px-3 py-2 text-xs text-white">
          Map style did not load. Add NEXT_PUBLIC_MAPBOX_TOKEN on Vercel, then
          redeploy.
        </p>
      ) : null}
    </div>
  );
}
