'use client';

import { useMutation } from '@tanstack/react-query';
import { bookingsAPI } from '@/lib/api';

interface TransitionParams {
  bookingId: string;
  status: string;
}

export function useBookingTransition() {
  return useMutation({
    mutationFn: async ({ bookingId, status }: TransitionParams) => {
      const response = await bookingsAPI.transition(bookingId, status);
      return response.data;
    },
  });
}