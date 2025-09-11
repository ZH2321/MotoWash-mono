'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingsAPI } from '@/lib/api';

export function useAdminBookings() {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const response = await bookingsAPI.adminGetAll();
      return response.data;
    },
  });
}