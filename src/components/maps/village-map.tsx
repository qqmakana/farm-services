"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";

type Pin = { lat: number; lng: number } | null;

/** Uber-style dropoff: black square with white border */
function dropoffIcon() {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:12px;height:12px;background:#111;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function Recenter({
  pin,
  dropoff,
  fallback,
}: {
  pin: Pin;
  dropoff: Pin;
  fallback: { lat: number; lng: number };
}) {
  const map = useMap();
  useEffect(() => {
    if (
      pin?.lat != null &&
      pin?.lng != null &&
      dropoff?.lat != null &&
      dropoff?.lng != null
    ) {
      const bounds = L.latLngBounds(
        [pin.lat, pin.lng],
        [dropoff.lat, dropoff.lng],
      );
      map.fitBounds(bounds.pad(0.28), { animate: true, duration: 0.6 });
      return;
    }
    if (pin?.lat != null && pin?.lng != null) {
      map.flyTo([pin.lat, pin.lng], 15, { duration: 0.6 });
    }
  }, [map, pin?.lat, pin?.lng, dropoff?.lat, dropoff?.lng]);

  useEffect(() => {
    if (pin || dropoff) return;
    map.setView([fallback.lat, fallback.lng], 13);
  }, [map, fallback.lat, fallback.lng, pin, dropoff]);

  return null;
}

function MapClickSelect({
  onSelect,
}: {
  onSelect?: (pin: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (!onSelect) return;
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FixLeafletIcons() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
  }, []);
  return null;
}

export function VillageMap({
  pin = null,
  dropoff = null,
  center = null,
  onSelect,
  className = "",
}: {
  pin?: Pin;
  /** Destination pin — black square marker */
  dropoff?: Pin;
  /** Country / market default center when no pin yet. */
  center?: { lat: number; lng: number } | null;
  /** Tap/click map to drop a pin (works together with landmark text). */
  onSelect?: (pin: { lat: number; lng: number }) => void;
  className?: string;
}) {
  const fallback = center ?? DEFAULT_MAP_CENTER;
  const mapCenter: [number, number] = pin
    ? [pin.lat, pin.lng]
    : [fallback.lat, fallback.lng];
  const destIcon = useMemo(() => dropoffIcon(), []);

  return (
    <div className={`h-full w-full ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={14}
        className="z-0 h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <FixLeafletIcons />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <Recenter pin={pin} dropoff={dropoff} fallback={fallback} />
        <MapClickSelect onSelect={onSelect} />
        {pin ? (
          <CircleMarker
            center={[pin.lat, pin.lng]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#111111",
              fillOpacity: 1,
              weight: 3,
            }}
          />
        ) : (
          <CircleMarker
            center={[fallback.lat, fallback.lng]}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#9a9a9a",
              fillOpacity: 0.85,
              weight: 2,
            }}
          />
        )}
        {dropoff ? (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={destIcon} />
        ) : null}
      </MapContainer>
    </div>
  );
}
