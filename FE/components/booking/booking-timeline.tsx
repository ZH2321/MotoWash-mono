import { Badge } from '@/components/ui/badge';
import { getStatusText, getStatusColor } from '@/lib/booking-utils';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface BookingTimelineProps {
  booking: any;
}

const TIMELINE_STEPS = [
  { status: 'CONFIRMED', title: 'ยืนยันการจอง' },
  { status: 'PICKUP_ASSIGNED', title: 'มอบหมายไรเดอร์' },
  { status: 'PICKED_UP', title: 'รับมอเตอร์ไซค์แล้ว' },
  { status: 'IN_WASH', title: 'กำลังล้าง' },
  { status: 'READY_FOR_RETURN', title: 'พร้อมส่งคืน' },
  { status: 'ON_THE_WAY_RETURN', title: 'กำลังส่งคืน' },
  { status: 'COMPLETED', title: 'เสร็จสิ้น' },
];

export function BookingTimeline({ booking }: BookingTimelineProps) {
  const currentStatusIndex = TIMELINE_STEPS.findIndex(step => step.status === booking.status);

  return (
    <div className="space-y-4">
      {TIMELINE_STEPS.map((step, index) => {
        const isPast = index < currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        const isFuture = index > currentStatusIndex;

        return (
          <div key={step.status} className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 mr-3">
              {isPast ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : isCurrent ? (
                <Clock className="w-6 h-6 text-blue-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
            </div>
            
            <div className="flex-1">
              <div className={`font-medium ${
                isPast ? 'text-green-600' :
                isCurrent ? 'text-blue-600' : 
                'text-gray-400'
              }`}>
                {step.title}
              </div>
              
              {isCurrent && (
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}