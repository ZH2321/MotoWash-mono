'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertCircle } from 'lucide-react';

interface SlotGridProps {
  availability: any;
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
}

const REASON_TEXTS: Record<string, string> = {
  past_15min_today: 'เลยเวลาจองแล้ว (ก่อนเวลา 15 นาที)',
  day_closed: 'ปิดทำการ',
  full: 'คิวเต็ม',
  maintenance: 'ปิดซ่อมบำรุง',
};

export function SlotGrid({ availability, selectedSlot, onSlotSelect }: SlotGridProps) {
  const { slots = [] } = availability;

  const getSlotStatus = (slot: any) => {
    if (!slot.bookable) {
      return {
        variant: 'secondary' as const,
        disabled: true,
        tooltip: REASON_TEXTS[slot.reason] || slot.reason,
      };
    }

    if (slot.reserved >= slot.quota) {
      return {
        variant: 'destructive' as const,
        disabled: true,
        tooltip: 'คิวเต็ม',
      };
    }

    const remaining = slot.quota - slot.reserved;
    if (remaining <= 2) {
      return {
        variant: 'secondary' as const,
        disabled: false,
        tooltip: `เหลือ ${remaining} คิว`,
      };
    }

    return {
      variant: 'outline' as const,
      disabled: false,
      tooltip: `ว่าง (${remaining}/${slot.quota})`,
    };
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.map((slot: any) => {
          const status = getSlotStatus(slot);
          const isSelected = selectedSlot === slot.timeSlot;

          return (
            <Tooltip key={slot.timeSlot}>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelected ? 'default' : status.variant}
                  size="sm"
                  className="h-auto p-3 flex flex-col items-center"
                  disabled={status.disabled}
                  onClick={() => !status.disabled && onSlotSelect(slot.timeSlot)}
                >
                  <Clock className="w-4 h-4 mb-1" />
                  <span className="font-medium">{slot.timeSlot}</span>
                  
                  {!status.disabled && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {slot.quota - slot.reserved}/{slot.quota}
                    </Badge>
                  )}
                  
                  {status.disabled && (
                    <AlertCircle className="w-3 h-3 mt-1 opacity-50" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{status.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {slots.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>ไม่มีเวลาให้บริการในวันนี้</p>
        </div>
      )}
    </TooltipProvider>
  );
}