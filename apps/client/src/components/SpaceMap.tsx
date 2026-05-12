"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SpaceMapPin from "./SpaceMapPin";

const spaceIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#6366f1"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

interface SpaceMapProps {
  spaces: Array<{
    id: number;
    name: string;
    images: unknown;
    latitude: number | null;
    longitude: number | null;
    pricePerHour: number | null;
    pricePerDay: number | null;
    pricingType: string;
    currency?: string;
    venue?: { name: string; latitude?: number | null; longitude?: number | null } | null;
  }>;
  onBoundsChange: (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => void;
  isLoading?: boolean;
}

function MapEvents({ onBoundsChange }: { onBoundsChange: SpaceMapProps["onBoundsChange"] }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        neLat: bounds.getNorthEast().lat,
        neLng: bounds.getNorthEast().lng,
        swLat: bounds.getSouthWest().lat,
        swLng: bounds.getSouthWest().lng,
      });
    },
  });
  return null;
}

const SpaceMap = ({ spaces, onBoundsChange, isLoading }: SpaceMapProps) => {
  // Find center from first space with coordinates, or default to Chisinau
  const center = useMemo(() => {
    for (const s of spaces) {
      const lat = s.venue?.latitude ?? s.latitude;
      const lng = s.venue?.longitude ?? s.longitude;
      if (lat && lng) return [lat, lng] as [number, number];
    }
    return [47.0105, 28.8638] as [number, number]; // Chisinau
  }, [spaces]);

  const spacesWithCoords = useMemo(() =>
    spaces.filter((s) => {
      const lat = s.venue?.latitude ?? s.latitude;
      const lng = s.venue?.longitude ?? s.longitude;
      return lat != null && lng != null;
    }),
  [spaces]);

  return (
    <div className="relative w-full h-full">
      <MapContainer center={center} zoom={12} className="w-full h-full z-0" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onBoundsChange={onBoundsChange} />
        {spacesWithCoords.map((space) => {
          const lat = (space.venue?.latitude ?? space.latitude)!;
          const lng = (space.venue?.longitude ?? space.longitude)!;
          return (
            <Marker key={space.id} position={[lat, lng]} icon={spaceIcon}>
              <Popup>
                <SpaceMapPin space={space} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
};

export default SpaceMap;
