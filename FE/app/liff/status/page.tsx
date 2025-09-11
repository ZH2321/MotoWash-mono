'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserBookings } from '@/hooks/use-user-bookings';
import { LoadingSpinner } from '@/components/loading-spinner';
import { getStatusColor, getStatusText } from '@/lib/booking-utils';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function StatusPage() {
  const { data: bookings, isLoading } = useUserBookings();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(b => 
    ['CONFIRMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_WASH', 'READY_FOR_RETURN', 'ON_THE_WAY_RETURN'].includes(b.status)
  ) || [];
  
  const pastBookings = bookings?.filter(b => 
    ['COMPLETED', 'CANCELLED'].includes(b.status)
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">สถานะการจอง</h1>

        {/* Upcoming Bookings */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">การจองปัจจุบัน</h2>
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ไม่มีการจองในขณะนี้
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <Link key={booking.id} href={`/liff/booking/${booking.id}`}>
                  <Card className="cursor-pointer transition-all hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {booking.packageName}
                        </CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(booking.scheduledDate).toLocaleDateString('th-TH')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          {booking.timeSlot}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          {booking.pickupAddress}
                        </div>
                      </div>
                      <div className="mt-3 text-right font-semibold">
                        ฿{booking.totalPrice}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Past Bookings */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">ประวัติการจอง</h2>
          {pastBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ไม่มีประวัติการจอง
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <Link key={booking.id} href={`/liff/booking/${booking.id}`}>
                  <Card className="cursor-pointer opacity-75 transition-all hover:opacity-100 hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {booking.packageName}
                        </CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(booking.scheduledDate).toLocaleDateString('th-TH')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          {booking.timeSlot}
                        </div>
                      </div>
                      <div className="mt-3 text-right font-semibold">
                        ฿{booking.totalPrice}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}