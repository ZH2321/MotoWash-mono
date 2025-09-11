'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/hooks/use-booking';
import { LoadingSpinner } from '@/components/loading-spinner';
import { BookingTimeline } from '@/components/booking/booking-timeline';
import { BookingMap } from '@/components/booking/booking-map';
import { getStatusColor, getStatusText } from '@/lib/booking-utils';
import { Phone, MessageCircle, Upload } from 'lucide-react';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: booking, isLoading } = useBooking(id as string);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">ไม่พบการจอง</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/liff')}>
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'AWAIT_SHOP_CONFIRM';
  const canReuploadSlip = booking.status === 'UNDER_REVIEW';
  const canReview = booking.status === 'COMPLETED' && !booking.hasReview;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">รายละเอียดการจอง</h1>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusText(booking.status)}
          </Badge>
        </div>

        {/* Booking Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ข้อมูลการจอง #{booking.id.slice(-6)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">แพ็กเกจ</div>
                <div className="font-medium">{booking.packageName}</div>
              </div>
              <div>
                <div className="text-gray-600">ราคา</div>
                <div className="font-medium">฿{booking.totalPrice}</div>
              </div>
              <div>
                <div className="text-gray-600">วันที่</div>
                <div className="font-medium">
                  {new Date(booking.scheduledDate).toLocaleDateString('th-TH')}
                </div>
              </div>
              <div>
                <div className="text-gray-600">เวลา</div>
                <div className="font-medium">{booking.timeSlot}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>สถานที่รับ-ส่ง</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingMap booking={booking} />
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <div className="text-gray-600">จุดรับ:</div>
                <div>{booking.pickupAddress}</div>
              </div>
              <div>
                <div className="text-gray-600">จุดส่ง:</div>
                <div>{booking.dropoffAddress}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>สถานะการดำเนินการ</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingTimeline booking={booking} />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>การจัดการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canReuploadSlip && (
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push(`/liff/pay/${booking.id}`)}
              >
                <Upload className="mr-2 h-4 w-4" />
                อัพโหลดสลิปใหม่
              </Button>
            )}

            {canReview && (
              <Button 
                className="w-full"
                onClick={() => router.push(`/liff/review/${booking.id}`)}
              >
                ให้คะแนนและรีวิว
              </Button>
            )}

            {canCancel && (
              <Button 
                className="w-full" 
                variant="destructive"
                onClick={() => {
                  // TODO: Implement cancel booking
                }}
              >
                ยกเลิกการจอง
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Phone className="mr-2 h-4 w-4" />
                โทรหาร้าน
              </Button>
              <Button variant="outline" size="sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                LINE OA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}