'use client';

import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '@/lib/api';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const [serviceArea, paymentChannels, businessHours] = await Promise.all([
        settingsAPI.getServiceArea(),
        settingsAPI.getPaymentChannels(),
        settingsAPI.getBusinessHours(),
      ]);
      
      return {
        serviceArea: serviceArea.data,
        paymentChannels: paymentChannels.data,
        businessHours: businessHours.data,
      };
    },
  });
}