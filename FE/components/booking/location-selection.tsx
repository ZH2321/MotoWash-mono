'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPicker } from '@/components/map-picker';
import { useBookingContext } from '@/contexts/booking-context';
import { settingsAPI } from '@/lib/api';
import { calculateDistance } from '@/lib/booking-utils';
import { MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface LocationSelectionProps {
  onNext: () => void;
  onPrev: () => void;
}

export function LocationSelection({ onNext, onPrev }: LocationSelectionProps) {
  const { state, dispatch } = useBookingContext();
  const [serviceArea, setServiceArea] = useState<any>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([13.7563, 100.5018]);

  useEffect(() => {
    // Load service area
    settingsAPI.getServiceArea().then(response => {
      setServiceArea(response.data);
      setCurrentLocation([response.data.centerLat, response.data.centerLng]);
    });

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handlePickupLocationPick = (lat: number, lng: number) => {
    if (serviceArea) {
      const distance = calculateDistance(
        lat, lng,
        serviceArea.centerLat, serviceArea.centerLng
      );

      if (distance > serviceArea.radiusKm) {
        toast.error(`สถานที่นี้อยู่นอกพื้นที่บริการ (ห่าง ${distance.toFixed(1)} กม.)`);
        return;
      }
    }

    dispatch({
      type: 'SET_PICKUP_LOCATION',
      payload: { lat, lng, address: pickupAddress || 'สถานที่ที่เลือก' }
    });
  };

  const handleDropoffLocationPick = (lat: number, lng: number) => {
    if (serviceArea) {
      const distance = calculateDistance(
        lat, lng,
        serviceArea.centerLat, serviceArea.centerLng
      );

      if (distance > serviceArea.radiusKm) {
        toast.error(`สถานที่นี้อยู่นอกพื้นที่บริการ (ห่าง ${distance.toFixed(1)} กม.)`);
        return;
      }
    }

    dispatch({
      type: 'SET_DROPOFF_LOCATION',
      payload: { lat, lng, address: dropoffAddress || 'สถานที่ที่เลือก' }
    });
  };

  const handleSameLocationToggle = (checked: boolean) => {
    dispatch({ type: 'SET_SAME_LOCATION', payload: checked });
    if (checked && state.pickupLocation) {
      dispatch({
        type: 'SET_DROPOFF_LOCATION',
        payload: state.pickupLocation
      });
    }
  };

  const handleNext = () => {
    if (!state.pickupLocation) {
      toast.error('กรุณาเลือกจุดรับมอเตอร์ไซค์');
      return;
    }
    if (!state.sameLocation && !state.dropoffLocation) {
      toast.error('กรุณาเลือกจุดส่งมอเตอร์ไซค์');
      return;
    }
    onNext();
  };

  const isPickupInRange = state.pickupLocation && serviceArea
    ? calculateDistance(
        state.pickupLocation.lat, state.pickupLocation.lng,
        serviceArea.centerLat, serviceArea.centerLng
      ) <= serviceArea.radiusKm
    : false;

  const isDropoffInRange = state.dropoffLocation && serviceArea
    ? calculateDistance(
        state.dropoffLocation.lat, state.dropoffLocation.lng,
        serviceArea.centerLat, serviceArea.centerLng
      ) <= serviceArea.radiusKm
    : false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">กำหนดสถานที่รับ-ส่ง</h2>
        
        {/* Service Area Info */}
        {serviceArea && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center text-sm text-blue-800">
                <MapPin className="mr-2 h-4 w-4" />
                <span>พื้นที่บริการ: รัศมี {serviceArea.radiusKm} กม. จากจุดศูนย์กลาง</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pickup Location */}
      <div>
        <h3 className="text-lg font-semibold mb-3">จุดรับมอเตอร์ไซค์</h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="pickup-address">ที่อยู่ / รายละเอียดเพิ่มเติม</Label>
            <Input
              id="pickup-address"
              placeholder="เช่น หอพักลาดพร้าว ห้อง 304"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardDescription>แตะบนแผนที่เพื่อเลือกจุดรับ</CardDescription>
            </CardHeader>
            <CardContent>
              <MapPicker
                center={currentLocation}
                radius={serviceArea?.radiusKm}
                onPick={handlePickupLocationPick}
                markers={state.pickupLocation ? [{
                  lat: state.pickupLocation.lat,
                  lng: state.pickupLocation.lng,
                  popup: 'จุดรับ'
                }] : []}
              />
              
              {state.pickupLocation && (
                <div className="mt-2 flex items-center text-sm">
                  {isPickupInRange ? (
                    <div className="flex items-center text-green-600">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>อยู่ในพื้นที่บริการ</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      <span>อยู่นอกพื้นที่บริการ</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Same Location Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="same-location"
          checked={state.sameLocation}
          onCheckedChange={handleSameLocationToggle}
        />
        <Label htmlFor="same-location">ส่งคืนที่จุดรับเดิม</Label>
      </div>

      {/* Dropoff Location */}
      {!state.sameLocation && (
        <div>
          <h3 className="text-lg font-semibold mb-3">จุดส่งมอเตอร์ไซค์</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="dropoff-address">ที่อยู่ / รายละเอียดเพิ่มเติม</Label>
              <Input
                id="dropoff-address"
                placeholder="เช่น คณะวิทยาศาสตร์ ตึกA ชั้น1"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardDescription>แตะบนแผนที่เพื่อเลือกจุดส่ง</CardDescription>
              </CardHeader>
              <CardContent>
                <MapPicker
                  center={currentLocation}
                  radius={serviceArea?.radiusKm}
                  onPick={handleDropoffLocationPick}
                  markers={[
                    ...(state.pickupLocation ? [{
                      lat: state.pickupLocation.lat,
                      lng: state.pickupLocation.lng,
                      popup: 'จุดรับ'
                    }] : []),
                    ...(state.dropoffLocation ? [{
                      lat: state.dropoffLocation.lat,
                      lng: state.dropoffLocation.lng,
                      popup: 'จุดส่ง'
                    }] : [])
                  ]}
                />
                
                {state.dropoffLocation && (
                  <div className="mt-2 flex items-center text-sm">
                    {isDropoffInRange ? (
                      <div className="flex items-center text-green-600">
                        <MapPin className="mr-1 h-4 w-4" />
                        <span>อยู่ในพื้นที่บริการ</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        <span>อยู่นอกพื้นที่บริการ</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev}>
          กลับ
        </Button>
        <Button 
          className="flex-1"
          onClick={handleNext}
          disabled={
            !state.pickupLocation || 
            !isPickupInRange ||
            (!state.sameLocation && (!state.dropoffLocation || !isDropoffInRange))
          }
        >
          ถัดไป: เลือกเวลา
        </Button>
      </div>
    </div>
  );
}