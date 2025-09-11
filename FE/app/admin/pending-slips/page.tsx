'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePendingSlips } from '@/hooks/use-pending-slips';
import { useSlipReview } from '@/hooks/use-slip-review';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Eye, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function PendingSlipsPage() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: pendingSlips, isLoading, refetch } = usePendingSlips();
  const reviewMutation = useSlipReview();

  const handleApprove = async (bookingId: string) => {
    try {
      await reviewMutation.mutateAsync({
        bookingId,
        action: 'APPROVE',
      });
      toast.success('อนุมัติสลิปเรียบร้อย');
      refetch();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleReject = async (bookingId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('กรุณาระบุเหตุผล');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        bookingId,
        action: 'REJECT',
        reason,
      });
      toast.success('ปฏิเสธสลิปเรียบร้อย');
      setIsDialogOpen(false);
      setRejectReason('');
      refetch();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">ตรวจสอบสลิปการโอน</h1>
          <p className="text-gray-600">
            รายการสลิปที่รอการตรวจสอบ ({pendingSlips?.length || 0} รายการ)
          </p>
        </div>

        {!pendingSlips?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              ไม่มีสลิปที่รอตรวจสอบ
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingSlips.map((booking: any) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        การจอง #{booking.id.slice(-6)}
                      </CardTitle>
                      <CardDescription>
                        {booking.customer.displayName} • {booking.packageName}
                      </CardDescription>
                    </div>
                    <Badge>รอตรวจสอบ</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">วันที่:</span>{' '}
                        {new Date(booking.scheduledDate).toLocaleDateString('th-TH')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">เวลา:</span> {booking.timeSlot}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">ยอดที่ชำระ:</span>{' '}
                        ฿{Math.ceil(booking.totalPrice * 0.2)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">วันที่อัพโหลด:</span>{' '}
                        {new Date(booking.paymentSlipUploadedAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">สลิปการโอน:</div>
                      {booking.paymentSlipUrl && (
                        <div className="relative h-40 w-full overflow-hidden rounded-lg border">
                          <Image
                            src={booking.paymentSlipUrl}
                            alt="Payment slip"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="mr-2 h-4 w-4" />
                            ดูใหญ่
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>สลิปการโอน</DialogTitle>
                          </DialogHeader>
                          <div className="relative h-96 w-full">
                            <Image
                              src={booking.paymentSlipUrl}
                              alt="Payment slip"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleApprove(booking.id)}
                      disabled={reviewMutation.isPending}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      อนุมัติ
                    </Button>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          ปฏิเสธ
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>ปฏิเสธการชำระเงิน</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reason">เหตุผลที่ปฏิเสธ</Label>
                            <Textarea
                              id="reason"
                              placeholder="กรุณาระบุเหตุผลที่ปฏิเสธ..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setIsDialogOpen(false)}
                            >
                              ยกเลิก
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleReject(selectedBooking?.id, rejectReason)}
                              disabled={reviewMutation.isPending}
                            >
                              ปฏิเสธ
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}