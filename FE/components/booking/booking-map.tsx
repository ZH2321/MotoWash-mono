'use client';

import { MapPicker } from '@/components/map-picker';

interface BookingMapProps {
  booking: any;
}

export function BookingMap({ booking }: BookingMapProps) {
  const markers = [
    {
      lat: booking.pickupLat,
      lng: booking.pickupLng,
      popup: 'จุดรับ'
    }
  ];

  // Add dropoff marker if different from pickup
  if (booking.pickupLat !== booking.dropoffLat || booking.pickupLng !== booking.dropoffLng) {
    markers.push({
      lat: booking.dropoffLat,
      lng: booking.dropoffLng,
      popup: 'จุดส่ง'
    });
  }

  const centerLat = (booking.pickupLat + booking.dropoffLat) / 2;
  const centerLng = (booking.pickupLng + booking.dropoffLng) / 2;

  return (
    <MapPicker
      center={[centerLat, centerLng]}
      markers={markers}
      className="h-48 w-full"
    />
  );
}