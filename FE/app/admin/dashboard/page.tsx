'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingKanban } from '@/components/admin/booking-kanban';
import { useAdminBookings } from '@/hooks/use-admin-bookings';
import { useBookingTransition } from '@/hooks/use-booking-transition';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BOOKING_STATUSES = [
  { status: 'CONFIRMED', title: 'ยืนยันแล้ว', color: 'bg-blue-100' },
  { status: 'PICKUP_ASSIGNED', title: 'มอบหมายไรเดอร์', color: 'bg-yellow-100' },
  { status: 'PICKED_UP', title: 'รับแล้ว', color: 'bg-orange-100' },
  { status: 'IN_WASH', title: 'กำลังล้าง', color: 'bg-purple-100' },
  { status: 'READY_FOR_RETURN', title: 'พร้อมส่ง', color: 'bg-indigo-100' },
  { status: 'ON_THE_WAY_RETURN', title: 'กำลังส่ง', color: 'bg-pink-100' },
  { status: 'COMPLETED', title: 'เสร็จสิ้น', color: 'bg-green-100' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: bookings, isLoading, refetch } = useAdminBookings();
  const transitionMutation = useBookingTransition();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/admin/login');
    }
  }, [isAuthenticated, user, router]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const bookingId = active.id as string;
    const newStatus = over.id as string;

    try {
      await transitionMutation.mutateAsync({ bookingId, status: newStatus });
      toast.success('อัพเดทสถานะสำเร็จ');
      refetch();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const getBookingsByStatus = (status: string) => 
    bookings?.filter(booking => booking.status === status) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">แดชบอร์ดแอดมิน</h1>
          <p className="text-gray-600">จัดการการจองและสถานะการดำเนินการ</p>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            {BOOKING_STATUSES.map((column) => {
              const columnBookings = getBookingsByStatus(column.status);
              
              return (
                <Card key={column.status} className={column.color}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {column.title}
                      <span className="ml-2 rounded-full bg-white px-2 py-1 text-xs">
                        {columnBookings.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SortableContext
                      items={columnBookings.map(b => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {columnBookings.map((booking) => (
                          <BookingKanban key={booking.id} booking={booking} />
                        ))}
                      </div>
                    </SortableContext>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}