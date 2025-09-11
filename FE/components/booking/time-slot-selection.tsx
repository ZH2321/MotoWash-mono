'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { SlotGrid } from '@/components/slot-grid';
import { useBookingContext } from '@/contexts/booking-context';
import { capacityAPI, bookingsAPI } from '@/lib/api';
import { format, addDays, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

interface TimeSlotSelectionProps {
  onNext: () => void;
  onPrev: () => void;
}

export function TimeSlotSelection({ onPrev }: TimeSlotSelectionProps) {
  const { state } = useBookingContext();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability();
    }
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await capacityAPI.getAvailability(dateStr);
      setAvailability(response.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลเวลาได้');
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !state.selectedPackage || !state.pickupLocation) {
      toast.error('ข้อมูลไม่ครบถ้วน');
      return;
    }

    setIsBooking(true);
    try {
      const bookingData = {
        packageId: state.selectedPackage.id,
        addons: state.selectedAddons.map(a => a.id),
        pickupLat: state.pickupLocation.lat,
        pickupLng: state.pickupLocation.lng,
        pickupAddress: state.pickupLocation.address,
        dropoffLat: state.dropoffLocation?.lat || state.pickupLocation.lat,
        dropoffLng: state.dropoffLocation?.lng || state.pickupLocation.lng,
        dropoffAddress: state.dropoffLocation?.address || state.pickupLocation.address,
        scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot,
      };

      const response = await bookingsAPI.hold(bookingData);
      const booking = response.data;

      toast.success('จองเวลาสำเร็จ! เริ่มกระบวนการชำระเงิน');
      router.push(`/liff/pay/${booking.id}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('เวลานี้เต็มแล้ว กรุณาเลือกเวลาอื่น');
        fetchAvailability(); // Refresh availability
      } else {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setIsBooking(false);
    }
  };

  const canSelectDate = (date: Date) => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 14); // Allow booking up to 14 days ahead
    return date >= today && date <= maxDate;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">เลือกวันและเวลา</h2>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">เลือกวันที่</CardTitle>
          <CardDescription>เลือกวันที่ต้องการใช้บริการ (จองล่วงหน้าได้สูงสุด 14 วัน)</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            disabled={(date) => !canSelectDate(date)}
            locale={th}
            className="rounded-md border"
          />
          
          {selectedDate && (
            <div className="mt-3 text-sm text-gray-600">
              วันที่เลือก: {format(selectedDate, 'EEEE ที่ d MMMM yyyy', { locale: th })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Slot Selection */}
      {availability && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">เลือกเวลา</CardTitle>
            <CardDescription>เลือกช่วงเวลาที่สะดวก</CardDescription>
          </CardHeader>
          <CardContent>
            <SlotGrid
              availability={availability}
              selectedSlot={selectedSlot}
              onSlotSelect={handleSlotSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedSlot && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">สรุปการจอง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>แพ็กเกจ:</span>
                <span>{state.selectedPackage?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>วันที่:</span>
                <span>{format(selectedDate, 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>เวลา:</span>
                <span>{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span>จุดรับ:</span>
                <span className="text-right">{state.pickupLocation?.address}</span>
              </div>
              <div className="flex justify-between">
                <span>จุดส่ง:</span>
                <span className="text-right">
                  {state.sameLocation ? 'ที่เดิม' : state.dropoffLocation?.address}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>ราคารวม:</span>
                <span className="text-blue-600">
                  ฿{(state.selectedPackage?.price || 0) + 
                     (state.selectedAddons?.reduce((sum, addon) => sum + addon.price, 0) || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev}>
          กลับ
        </Button>
        <Button 
          className="flex-1"
          onClick={handleBooking}
          disabled={!selectedSlot || isBooking}
        >
          {isBooking ? 'กำลังจอง...' : 'ยืนยันการจอง'}
        </Button>
      </div>
    </div>
  );
}