"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { type GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_STYLE,
  MAPBOX_TOKEN,
  type MapPin,
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

function pinEl(kind: "pickup" | "dropoff" | "you" | "job" | "car") {
  const el = document.createElement("div");
  el.className = `vr-map-pin vr-map-pin-${kind}`;
  el.setAttribute("aria-hidden", "true");
  return el;
}

function emptyRoute() {
  return { type: "FeatureCollection" as const, features: [] };
}

function add3dBuildings(map: mapboxgl.Map) {
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
        "fill-extrusion-color": "#222222",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.82,
      },
    },
    labelLayerId,
  );
}

function configureBasemap(map: mapboxgl.Map, cinematic: boolean) {
  if (cinematic) add3dBuildings(map);
}

function ensureRouteLayer(map: mapboxgl.Map) {
  if (map.getSource("vr-route")) return;
  map.addSource("vr-route", {
    type: "geojson",
    lineMetrics: true,
    data: emptyRoute(),
  });
  map.addLayer({
    id: "vr-route-glow",
    type: "line",
    source: "vr-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": 12,
      "line-opacity": 0.28,
      "line-color": "#276EF1",
      "line-blur": 6,
    },
  });
  map.addLayer({
    id: "vr-route-line",
    type: "line",
    source: "vr-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": 4.5,
      "line-gradient": [
        "interpolate",
        ["linear"],
        ["line-progress"],
        0,
        "#111111",
        1,
        "#276EF1",
      ],
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
  className = "",
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
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const syncRef = useRef<() => void>(() => {});
  const onSelectRef = useRef(onSelect);
  const onSelectJobRef = useRef(onSelectJob);
  const [mapError, setMapError] = useState<string | null>(null);
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
    routeLine,
  });
  stateRef.current = {
    center,
    pin,
    dropoff,
    driverLocation,
    jobs,
    cars,
    cinematic,
    routeLine,
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
          if (!cancelled) setRouteLine(null);
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

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: wrap,
      style: MAPBOX_STYLE,
      center: [center.lng, center.lat],
      zoom: cinematic ? 14.4 : 14,
      pitch: cinematic ? 48 : 0,
      bearing: cinematic ? -18 : 0,
      attributionControl: true,
      logoPosition: "bottom-left",
      minZoom: 3,
      maxPitch: 62,
    });
    mapRef.current = map;

    const sync = () => {
      const m = mapRef.current;
      if (!m?.isStyleLoaded()) return;
      const s = stateRef.current;
      configureBasemap(m, s.cinematic);
      ensureRouteLayer(m);

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
      ) => {
        const el = pinEl(kind);
        if (job) {
          el.title = job.label;
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            onSelectJobRef.current?.(job.id);
          });
        }
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(lngLat)
          .addTo(m);
        markersRef.current.push(marker);
      };

      if (s.driverLocation) {
        add([s.driverLocation.lng, s.driverLocation.lat], "you");
      }
      if (s.pin) add([s.pin.lng, s.pin.lat], "pickup");
      else if (!s.driverLocation) add([s.center.lng, s.center.lat], "pickup");
      if (s.dropoff) add([s.dropoff.lng, s.dropoff.lat], "dropoff");
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
          padding: s.cinematic
            ? { top: 96, bottom: 260, left: 56, right: 56 }
            : 40,
          maxZoom: 15.6,
          pitch: s.cinematic ? 38 : 0,
          duration: 850,
          essential: true,
        });
        return;
      }

      if (s.pin && s.driverLocation) {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([s.pin.lng, s.pin.lat])
          .extend([s.driverLocation.lng, s.driverLocation.lat]);
        m.fitBounds(bounds, {
          padding: s.cinematic
            ? { top: 96, bottom: 180, left: 56, right: 56 }
            : 40,
          maxZoom: 15.6,
          pitch: s.cinematic ? 38 : 0,
          duration: 850,
          essential: true,
        });
        return;
      }

      const focus = s.pin ?? s.driverLocation ?? s.center;
      m.easeTo({
        center: [focus.lng, focus.lat],
        zoom: s.pin || s.driverLocation ? 15.1 : 13.4,
        pitch: s.cinematic ? 48 : 0,
        bearing: s.cinematic ? -18 : 0,
        duration: 700,
        essential: true,
      });
    };

    syncRef.current = sync;
    map.on("style.load", sync);
    map.on("error", (event) => {
      const message = event.error?.message ?? "Map failed to load";
      if (/token|401|403|style/i.test(message)) setMapError(message);
    });
    map.on("click", (e) => {
      onSelectRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(wrap);

    return () => {
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
  }, [pin, dropoff, driverLocation, jobs, cars, center.lat, center.lng, cinematic, routeLine]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        ref={wrapRef}
        data-testid="ride-map"
        className="vr-mapbox h-full w-full bg-[#1a1a1a]"
      />
      {mapError ? (
        <p className="absolute inset-x-3 top-24 z-10 rounded-lg bg-black/80 px-3 py-2 text-xs text-white">
          Map style did not load. Add NEXT_PUBLIC_MAPBOX_TOKEN on Vercel, then
          redeploy.
        </p>
      ) : null}
    </div>
  );
}
