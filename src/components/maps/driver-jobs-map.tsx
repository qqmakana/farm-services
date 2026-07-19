"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";

export type JobMapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

function Recenter({
  center,
}: {
  center: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 13, { animate: true });
    }
  }, [map, center?.lat, center?.lng]);
  return null;
}

function FixIcons() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
  }, []);
  return null;
}

const jobIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:9999px;background:#1A4D3A;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function DriverJobsMap({
  driverLocation,
  jobs,
  onSelectJob,
  className = "",
}: {
  driverLocation: { lat: number; lng: number } | null;
  jobs: JobMapPin[];
  onSelectJob: (id: string) => void;
  className?: string;
}) {
  const center = driverLocation ?? DEFAULT_MAP_CENTER;

  return (
    <div className={`h-full w-full ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <FixIcons />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OSM'
        />
        <Recenter center={driverLocation} />
        {driverLocation ? (
          <CircleMarker
            center={[driverLocation.lat, driverLocation.lng]}
            radius={11}
            pathOptions={{
              color: "#fff",
              fillColor: "#2563EB",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent={false}>
              You
            </Tooltip>
          </CircleMarker>
        ) : null}
        {jobs.map((j) => (
          <Marker
            key={j.id}
            position={[j.lat, j.lng]}
            icon={jobIcon}
            eventHandlers={{
              click: () => onSelectJob(j.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              {j.label}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
