'use client';

import { useMutation } from '@tanstack/react-query';
import { settingsAPI } from '@/lib/api';

interface UpdateParams {
  type: string;
  data: any;
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: async ({ type, data }: UpdateParams) => {
      const response = await settingsAPI.updateSettings(type, data);
      return response.data;
    },
  });
}