'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';

export function usePendingSlips() {
  return useQuery({
    queryKey: ['pending-slips'],
    queryFn: async () => {
      const response = await adminAPI.getPendingSlips();
      return response.data;
    },
  });
}