'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Countdown } from '@/components/countdown';
import { useBooking } from '@/hooks/use-booking';
import { usePaymentChannels } from '@/hooks/use-payment-channels';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { Upload, Copy, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: booking, isLoading: bookingLoading } = useBooking(id as string);
  const { data: paymentChannels, isLoading: channelsLoading } = usePaymentChannels();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSlip = async () => {
    if (!selectedFile || !booking) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('slip', selectedFile);
      
      const response = await fetch(`/api/bookings/${booking.id}/payment-slip`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('อัพโหลดสลิปสำเร็จ! รอการตรวจสอบจากทางร้าน');
        router.push(`/liff/booking/${booking.id}`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัพโหลด กรุณาลองใหม่');
    } finally {
      setIsUploading(false);
    }
  };

  const handleHoldExpire = () => {
    toast.error('หมดเวลาจอง กรุณาเลือกเวลาใหม่');
    router.push('/liff/book');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('คัดลอกแล้ว!');
  };

  if (bookingLoading || channelsLoading) {
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

  if (booking.status !== 'HOLD') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <CardTitle>จองสำเร็จแล้ว!</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/liff/booking/${booking.id}`)}>
              ดูรายละเอียดการจอง
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const depositAmount = Math.ceil(booking.totalPrice * 0.2); // 20% deposit

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        {/* Hold Timer */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader className="text-center">
            <CardTitle className="text-orange-800">เหลือเวลาในการจอง</CardTitle>
            <div className="text-2xl font-bold text-orange-600">
              <Countdown 
                targetDate={new Date(booking.holdExpiresAt)}
                onExpire={handleHoldExpire}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>สรุปการจอง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>แพ็กเกจ:</span>
                <span>{booking.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span>วันที่:</span>
                <span>{new Date(booking.scheduledDate).toLocaleDateString('th-TH')}</span>
              </div>
              <div className="flex justify-between">
                <span>เวลา:</span>
                <span>{booking.timeSlot}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>มัดจำที่ต้องชำระ:</span>
                  <span>฿{depositAmount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Channels */}
        {paymentChannels && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>ช่องทางการชำระเงิน</CardTitle>
              <CardDescription>
                โอนเงินมัดจำ ฿{depositAmount} ตามช่องทางใดช่องทางหนึ่ง
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentChannels.qrCode && (
                <div className="text-center">
                  <div className="mb-2 font-medium">QR Code พร้อมเพย์</div>
                  <div className="mx-auto w-48">
                    <Image
                      src={paymentChannels.qrCode}
                      alt="QR Code"
                      width={192}
                      height={192}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}

              {paymentChannels.promptPay && (
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="mb-2 font-medium text-blue-800">พร้อมเพย์</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{paymentChannels.promptPay}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(paymentChannels.promptPay!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {paymentChannels.bankAccount && (
                <div className="rounded-lg bg-green-50 p-3">
                  <div className="mb-2 font-medium text-green-800">บัญชีธนาคาร</div>
                  <div className="text-sm">{paymentChannels.bankAccount}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Slip */}
        <Card>
          <CardHeader>
            <CardTitle>อัพโหลดสลิปการโอน</CardTitle>
            <CardDescription>
              อัพโหลดสลิปการโอนเงินเพื่อยืนยันการชำระ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slip">เลือกไฟล์รูปภาพ</Label>
              <Input
                id="slip"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </div>
            
            {selectedFile && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full"
              onClick={handleUploadSlip}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'กำลังอัพโหลด...' : 'ยืนยันการชำระ'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}