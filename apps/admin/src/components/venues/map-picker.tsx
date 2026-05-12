"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const indigoPin = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#6366f1"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

const CHISINAU_LAT = 47.0105;
const CHISINAU_LNG = 28.8638;

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MapPicker = ({ latitude, longitude, onChange }: MapPickerProps) => {
  const center: [number, number] = [
    latitude ?? CHISINAU_LAT,
    longitude ?? CHISINAU_LNG,
  ];

  return (
    <div className="h-[300px] overflow-hidden rounded-lg">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {latitude != null && longitude != null && (
          <Marker position={[latitude, longitude]} icon={indigoPin} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPicker;
