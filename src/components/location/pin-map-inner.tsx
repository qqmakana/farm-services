"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FixIcons() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
  }, []);
  return null;
}

export function PinMapInner({
  lat,
  lng,
  hasPin,
  onPick,
}: {
  lat: number;
  lng: number;
  hasPin: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <div className="h-48 w-full overflow-hidden rounded-xl border border-[var(--ru-line)]">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <FixIcons />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onPick={onPick} />
        {hasPin ? (
          <CircleMarker
            center={[lat, lng]}
            radius={10}
            pathOptions={{
              color: "#1A4D3A",
              fillColor: "#1A4D3A",
              fillOpacity: 0.9,
              weight: 3,
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
