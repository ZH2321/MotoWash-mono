'use client';

import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '@/lib/api';

export function usePaymentChannels() {
  return useQuery({
    queryKey: ['payment-channels'],
    queryFn: async () => {
      const response = await settingsAPI.getPaymentChannels();
      return response.data;
    },
  });
}