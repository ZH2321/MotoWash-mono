export const BOOKING_STATUSES = {
  HOLD: 'HOLD',
  AWAIT_SHOP_CONFIRM: 'AWAIT_SHOP_CONFIRM',
  CONFIRMED: 'CONFIRMED',
  PICKUP_ASSIGNED: 'PICKUP_ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_WASH: 'IN_WASH',
  READY_FOR_RETURN: 'READY_FOR_RETURN',
  ON_THE_WAY_RETURN: 'ON_THE_WAY_RETURN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  UNDER_REVIEW: 'UNDER_REVIEW',
};

export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    [BOOKING_STATUSES.HOLD]: 'จองชั่วคราว',
    [BOOKING_STATUSES.AWAIT_SHOP_CONFIRM]: 'รอยืนยันจากร้าน',
    [BOOKING_STATUSES.UNDER_REVIEW]: 'รอตรวจสอบสลิป',
    [BOOKING_STATUSES.CONFIRMED]: 'ยืนยันแล้ว',
    [BOOKING_STATUSES.PICKUP_ASSIGNED]: 'มอบหมายไรเดอร์',
    [BOOKING_STATUSES.PICKED_UP]: 'รับแล้ว',
    [BOOKING_STATUSES.IN_WASH]: 'กำลังล้าง',
    [BOOKING_STATUSES.READY_FOR_RETURN]: 'พร้อมส่ง',
    [BOOKING_STATUSES.ON_THE_WAY_RETURN]: 'กำลังส่ง',
    [BOOKING_STATUSES.COMPLETED]: 'เสร็จสิ้น',
    [BOOKING_STATUSES.CANCELLED]: 'ยกเลิก',
  };
  return statusTexts[status] || status;
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    [BOOKING_STATUSES.HOLD]: 'bg-yellow-100 text-yellow-800',
    [BOOKING_STATUSES.AWAIT_SHOP_CONFIRM]: 'bg-orange-100 text-orange-800',
    [BOOKING_STATUSES.UNDER_REVIEW]: 'bg-purple-100 text-purple-800',
    [BOOKING_STATUSES.CONFIRMED]: 'bg-blue-100 text-blue-800',
    [BOOKING_STATUSES.PICKUP_ASSIGNED]: 'bg-indigo-100 text-indigo-800',
    [BOOKING_STATUSES.PICKED_UP]: 'bg-teal-100 text-teal-800',
    [BOOKING_STATUSES.IN_WASH]: 'bg-cyan-100 text-cyan-800',
    [BOOKING_STATUSES.READY_FOR_RETURN]: 'bg-emerald-100 text-emerald-800',
    [BOOKING_STATUSES.ON_THE_WAY_RETURN]: 'bg-green-100 text-green-800',
    [BOOKING_STATUSES.COMPLETED]: 'bg-green-100 text-green-800',
    [BOOKING_STATUSES.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};