'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { LatLng, Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  center: [number, number];
  radius?: number;
  onPick?: (lat: number, lng: number) => void;
  onCenterChange?: (lat: number, lng: number) => void;
  markers?: Array<{ lat: number; lng: number; popup?: string }>;
  className?: string;
}

function MapEvents({ onPick, onCenterChange }: { onPick?: (lat: number, lng: number) => void; onCenterChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onPick) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    },
    moveend(e) {
      if (onCenterChange) {
        const center = e.target.getCenter();
        onCenterChange(center.lat, center.lng);
      }
    },
  });
  return null;
}

export function MapPicker({ 
  center, 
  radius, 
  onPick, 
  onCenterChange, 
  markers = [],
  className = "h-64 w-full" 
}: MapPickerProps) {
  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEvents onPick={onPick} onCenterChange={onCenterChange} />
        
        {/* Center marker */}
        <Marker position={center} />
        
        {/* Service radius circle */}
        {radius && (
          <Circle
            center={center}
            radius={radius * 1000} // Convert km to meters
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
            }}
          />
        )}
        
        {/* Additional markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
          />
        ))}
      </MapContainer>
    </div>
  );
}