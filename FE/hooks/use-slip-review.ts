'use client';

import { useMutation } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';

interface ReviewParams {
  bookingId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

export function useSlipReview() {
  return useMutation({
    mutationFn: async ({ bookingId, action, reason }: ReviewParams) => {
      const response = await adminAPI.reviewSlip(bookingId, action, reason);
      return response.data;
    },
  });
}