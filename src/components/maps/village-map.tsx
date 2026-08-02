"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";

type Pin = { lat: number; lng: number } | null;

function Recenter({
  pin,
  fallback,
}: {
  pin: Pin;
  fallback: { lat: number; lng: number };
}) {
  const map = useMap();
  useEffect(() => {
    if (pin?.lat != null && pin?.lng != null) {
      map.flyTo([pin.lat, pin.lng], 15, { duration: 0.6 });
    }
  }, [map, pin?.lat, pin?.lng]);

  useEffect(() => {
    if (pin) return;
    map.setView([fallback.lat, fallback.lng], 13);
  }, [map, fallback.lat, fallback.lng, pin]);

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
  center = null,
  onSelect,
  className = "",
}: {
  pin?: Pin;
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

  return (
    <div className={`h-full w-full ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <FixLeafletIcons />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <Recenter pin={pin} fallback={fallback} />
        <MapClickSelect onSelect={onSelect} />
        {pin ? (
          <CircleMarker
            center={[pin.lat, pin.lng]}
            radius={10}
            pathOptions={{
              color: "#000000",
              fillColor: "#000000",
              fillOpacity: 0.9,
              weight: 3,
            }}
          />
        ) : (
          <CircleMarker
            center={[fallback.lat, fallback.lng]}
            radius={8}
            pathOptions={{
              color: "#000000",
              fillColor: "#a3a3a3",
              fillOpacity: 0.7,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
