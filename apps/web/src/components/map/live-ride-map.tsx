'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon paths in Next.js bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom School Van Marker Icon
const vanIcon = L.divIcon({
  className: 'custom-van-marker',
  html: `
    <div style="
      background-color: #2563eb;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37,99,235,0.4);
      border: 2px solid white;
      position: relative;
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5c-.3-1-1.1-1.8-2.1-1.8H5.7c-1 0-1.8.8-2.1 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2C2.5 16.3 3 18 3 18h3"/>
        <circle cx="7" cy="18" r="2"/>
        <circle cx="17" cy="18" r="2"/>
      </svg>
      <div style="
        position: absolute;
        inset: -4px;
        border-radius: 16px;
        border: 2px solid #3b82f6;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        opacity: 0.75;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// School Marker Icon
const schoolIcon = L.divIcon({
  className: 'custom-school-marker',
  html: `
    <div style="
      background-color: #10b981;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(16,185,129,0.4);
      border: 2px solid white;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Helper component to smoothly re-center map on new coordinates
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

export interface LiveRideMapProps {
  currentLat: number;
  currentLng: number;
  routeName: string;
  driverName?: string;
  passengers?: any[];
  trail?: [number, number][];
}

export default function LiveRideMap({
  currentLat,
  currentLng,
  routeName,
  driverName,
  passengers = [],
  trail = [],
}: LiveRideMapProps) {
  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ||
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const attribution =
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-border shadow-elevated">
      <MapContainer
        center={[currentLat, currentLng]}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full z-10"
      >
        <MapRecenter lat={currentLat} lng={currentLng} />

        <TileLayer url={tileUrl} attribution={attribution} maxZoom={19} />

        {/* Trail Polyline */}
        {trail.length > 1 && (
          <Polyline positions={trail} color="#3b82f6" weight={4} opacity={0.6} dashArray="8, 8" />
        )}

        {/* Live School Van Marker */}
        <Marker position={[currentLat, currentLng]} icon={vanIcon}>
          <Popup>
            <div className="p-1 space-y-1">
              <p className="font-bold text-xs">{routeName}</p>
              {driverName && <p className="text-[11px] text-muted-foreground">Driver: {driverName}</p>}
              <p className="text-[10px] text-blue-600 font-mono">Live Telemetry Active</p>
            </div>
          </Popup>
        </Marker>

        {/* Passenger School Markers */}
        {passengers.map((p) => {
          const school = p.child?.school;
          if (!school?.latitude || !school?.longitude) return null;
          return (
            <Marker key={p.id} position={[school.latitude, school.longitude]} icon={schoolIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-xs">{school.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.child?.firstName}'s School Destination</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
