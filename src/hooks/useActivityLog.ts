import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ActivityLogPageResponse } from '@/types';

// ===== Query Keys Factory =====
export const activityLogKeys = {
  all: ['activities'] as const,
  list: (params: { page: number; size: number; taskId?: string }) =>
    [...activityLogKeys.all, params] as const,
};

export function useActivityLogQuery(params: { page: number; size: number; taskId?: string }) {
  return useQuery({
    queryKey: activityLogKeys.list(params),
    queryFn: async (): Promise<ActivityLogPageResponse> => {
      const response = await api.get<ActivityLogPageResponse>('/activities', { params });
      return response.data;
    },
    staleTime: 0,
  });
}
