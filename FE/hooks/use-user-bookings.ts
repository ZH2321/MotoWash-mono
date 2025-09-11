'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingsAPI } from '@/lib/api';

export function useUserBookings() {
  return useQuery({
    queryKey: ['user-bookings'],
    queryFn: async () => {
      const response = await bookingsAPI.getUserBookings();
      return response.data;
    },
  });
}