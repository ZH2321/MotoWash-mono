'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingsAPI } from '@/lib/api';

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await bookingsAPI.get(id);
      return response.data;
    },
    enabled: !!id,
  });
}