"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";

type Pin = { lat: number; lng: number } | null;

function Recenter({ pin }: { pin: Pin }) {
  const map = useMap();
  useEffect(() => {
    if (pin?.lat != null && pin?.lng != null) {
      map.flyTo([pin.lat, pin.lng], 15, { duration: 0.6 });
    }
  }, [map, pin?.lat, pin?.lng]);
  return null;
}

function FixLeafletIcons() {
  useEffect(() => {
    // Default marker asset paths break under bundlers — we use CircleMarker instead.
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
  }, []);
  return null;
}

export function VillageMap({
  pin = null,
  className = "",
}: {
  pin?: Pin;
  className?: string;
}) {
  const center: [number, number] = pin
    ? [pin.lat, pin.lng]
    : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];

  return (
    <div className={`h-full w-full ${className}`}>
      <MapContainer
        center={center}
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
        <Recenter pin={pin} />
        {pin ? (
          <CircleMarker
            center={[pin.lat, pin.lng]}
            radius={10}
            pathOptions={{
              color: "#1A4D3A",
              fillColor: "#1A4D3A",
              fillOpacity: 0.9,
              weight: 3,
            }}
          />
        ) : (
          <CircleMarker
            center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
            radius={8}
            pathOptions={{
              color: "#1A4D3A",
              fillColor: "#4ade80",
              fillOpacity: 0.7,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
