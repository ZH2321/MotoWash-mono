'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { MapPicker } from '@/components/map-picker';
import { useSettings } from '@/hooks/use-settings';
import { useUpdateSettings } from '@/hooks/use-update-settings';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { Clock, MapPin, CreditCard } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const [businessHours, setBusinessHours] = useState({
    weekdayStart: '09:00',
    weekdayEnd: '18:00',
    slotMinutes: 60,
  });

  const [serviceArea, setServiceArea] = useState({
    centerLat: 13.7563,
    centerLng: 100.5018,
    radiusKm: 5,
  });

  const [paymentChannels, setPaymentChannels] = useState({
    promptPay: '',
    bankAccount: '',
    qrCodeFile: null as File | null,
  });

  const handleUpdateBusinessHours = async () => {
    try {
      await updateMutation.mutateAsync({
        type: 'business_hours',
        data: businessHours,
      });
      toast.success('อัพเดทเวลาทำการสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleUpdateServiceArea = async () => {
    try {
      await updateMutation.mutateAsync({
        type: 'service_area',
        data: serviceArea,
      });
      toast.success('อัพเดทพื้นที่บริการสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleUpdatePaymentChannels = async () => {
    try {
      const formData = new FormData();
      if (paymentChannels.qrCodeFile) {
        formData.append('qrCode', paymentChannels.qrCodeFile);
      }
      formData.append('promptPay', paymentChannels.promptPay);
      formData.append('bankAccount', paymentChannels.bankAccount);

      await updateMutation.mutateAsync({
        type: 'payment_channels',
        data: formData,
      });
      toast.success('อัพเดทช่องทางการชำระเงินสำเร็จ');
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
          <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
          <p className="text-gray-600">จัดการการตั้งค่าต่างๆ ของระบบ</p>
        </div>

        <Tabs defaultValue="hours" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hours">เวลาทำการ</TabsTrigger>
            <TabsTrigger value="service-area">พื้นที่บริการ</TabsTrigger>
            <TabsTrigger value="payment">การชำระเงิน</TabsTrigger>
          </TabsList>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  เวลาทำการ
                </CardTitle>
                <CardDescription>
                  กำหนดเวลาทำการและระยะเวลาของแต่ละสล็อต
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weekday-start">เวลาเปิด</Label>
                    <Input
                      id="weekday-start"
                      type="time"
                      value={businessHours.weekdayStart}
                      onChange={(e) =>
                        setBusinessHours(prev => ({ ...prev, weekdayStart: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekday-end">เวลาปิด</Label>
                    <Input
                      id="weekday-end"
                      type="time"
                      value={businessHours.weekdayEnd}
                      onChange={(e) =>
                        setBusinessHours(prev => ({ ...prev, weekdayEnd: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>ระยะเวลาแต่ละสล็อต (นาที)</Label>
                  <div className="mt-2 px-2">
                    <Slider
                      value={[businessHours.slotMinutes]}
                      onValueChange={([value]) =>
                        setBusinessHours(prev => ({ ...prev, slotMinutes: value }))
                      }
                      min={30}
                      max={120}
                      step={15}
                    />
                    <div className="mt-1 text-center text-sm text-gray-600">
                      {businessHours.slotMinutes} นาที
                    </div>
                  </div>
                </div>

                <Button onClick={handleUpdateBusinessHours} disabled={updateMutation.isPending}>
                  บันทึกการตั้งค่า
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service-area">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  พื้นที่บริการ
                </CardTitle>
                <CardDescription>
                  กำหนดจุดศูนย์กลางและรัศมีการให้บริการ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64">
                  <MapPicker
                    center={[serviceArea.centerLat, serviceArea.centerLng]}
                    radius={serviceArea.radiusKm}
                    onCenterChange={(lat, lng) =>
                      setServiceArea(prev => ({ ...prev, centerLat: lat, centerLng: lng }))
                    }
                  />
                </div>

                <div>
                  <Label>รัศมีการให้บริการ (กิโลเมตร)</Label>
                  <div className="mt-2 px-2">
                    <Slider
                      value={[serviceArea.radiusKm]}
                      onValueChange={([value]) =>
                        setServiceArea(prev => ({ ...prev, radiusKm: value }))
                      }
                      min={1}
                      max={20}
                      step={0.5}
                    />
                    <div className="mt-1 text-center text-sm text-gray-600">
                      {serviceArea.radiusKm} กิโลเมตร
                    </div>
                  </div>
                </div>

                <Button onClick={handleUpdateServiceArea} disabled={updateMutation.isPending}>
                  บันทึกการตั้งค่า
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  ช่องทางการชำระเงิน
                </CardTitle>
                <CardDescription>
                  จัดการช่องทางการรับชำระเงิน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="promptpay">หมายเลขพร้อมเพย์</Label>
                  <Input
                    id="promptpay"
                    placeholder="0xx-xxx-xxxx"
                    value={paymentChannels.promptPay}
                    onChange={(e) =>
                      setPaymentChannels(prev => ({ ...prev, promptPay: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="bank">บัญชีธนาคาร</Label>
                  <Textarea
                    id="bank"
                    placeholder="ธนาคารกสิกรไทย&#10;เลขที่บัญชี: xxx-x-xxxxx-x&#10;ชื่อบัญชี: บริษัท..."
                    value={paymentChannels.bankAccount}
                    onChange={(e) =>
                      setPaymentChannels(prev => ({ ...prev, bankAccount: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="qr-code">QR Code พร้อมเพย์</Label>
                  <Input
                    id="qr-code"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setPaymentChannels(prev => ({ 
                        ...prev, 
                        qrCodeFile: e.target.files?.[0] || null 
                      }))
                    }
                  />
                </div>

                <Button onClick={handleUpdatePaymentChannels} disabled={updateMutation.isPending}>
                  บันทึกการตั้งค่า
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}