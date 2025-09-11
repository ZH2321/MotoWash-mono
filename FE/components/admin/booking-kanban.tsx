'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getStatusColor, getStatusText } from '@/lib/booking-utils';
import { Calendar, Clock, MapPin, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface BookingKanbanProps {
  booking: any;
}

export function BookingKanban({ booking }: BookingKanbanProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: booking.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-move hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm">
              #{booking.id.slice(-6)}
            </CardTitle>
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            <div className="flex items-center">
              <User className="mr-1 h-3 w-3" />
              <span>{booking.customer.displayName}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-3 w-3" />
              <span>{format(new Date(booking.scheduledDate), 'dd MMM', { locale: th })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              <span>{booking.timeSlot}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-1 h-3 w-3" />
              <span className="truncate">{booking.pickupAddress}</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="font-bold text-sm">฿{booking.totalPrice}</span>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  ดูรายละเอียด
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>รายละเอียดการจอง #{booking.id.slice(-6)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">ลูกค้า</div>
                      <div>{booking.customer.displayName}</div>
                      <div className="text-gray-600">{booking.customer.phone || 'ไม่ระบุ'}</div>
                    </div>
                    <div>
                      <div className="font-medium">แพ็กเกจ</div>
                      <div>{booking.packageName}</div>
                      <div className="text-gray-600">฿{booking.totalPrice}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm mb-2">เวลานัดหมาย</div>
                    <div className="text-sm">
                      {format(new Date(booking.scheduledDate), 'EEEE ที่ d MMMM yyyy', { locale: th })}
                    </div>
                    <div className="text-sm text-gray-600">{booking.timeSlot}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm mb-2">สถานที่</div>
                    <div className="text-sm">
                      <div className="mb-1">
                        <span className="font-medium">รับ:</span> {booking.pickupAddress}
                      </div>
                      <div>
                        <span className="font-medium">ส่ง:</span> {booking.dropoffAddress}
                      </div>
                    </div>
                  </div>
                  
                  {booking.specialInstructions && (
                    <div>
                      <div className="font-medium text-sm mb-2">หมายเหตุ</div>
                      <div className="text-sm text-gray-600">{booking.specialInstructions}</div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {booking.customer.phone && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="mr-1 h-3 w-3" />
                        โทร
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1">
                      LINE
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}